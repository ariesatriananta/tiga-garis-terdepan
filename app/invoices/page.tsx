"use client";

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Search,
  Printer,
  Download,
  Filter,
  Receipt,
} from 'lucide-react';
import type { Contract, Invoice, InvoiceStatus } from '@/types';
import { formatCurrency, formatDate } from '@/lib/numbering';
import { useToast } from '@/hooks/use-toast';
import { fetchInvoices } from '@/lib/api/invoices';
import { fetchContracts } from '@/lib/api/contracts';
import { fetchTermins } from '@/lib/api/termins';
import { fetchSettings, type SettingsPayload } from '@/lib/api/settings';
import * as XLSX from 'xlsx';
import { terbilang } from '@/lib/terbilang';

export default function Invoices() {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(20);
  const [terminNameById, setTerminNameById] = useState<Record<string, string>>({});
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [headerDataUrl, setHeaderDataUrl] = useState<string>('');
  const [settings, setSettings] = useState<SettingsPayload | null>(null);
  const bankOptions = [
    {
      id: 'mandiri-arteri',
      bank: 'Bank Mandiri',
      branch: 'KCP Jakarta Arteri Pondok Indah',
      account: '1010-0333-303-304',
    },
    {
      id: 'mandiri-depok',
      bank: 'Bank Mandiri',
      branch: 'KCP Depok Timur',
      account: '157-00-3330330-7',
    },
  ];
  const [bankOptionId, setBankOptionId] = useState(bankOptions[0].id);

  const searchQuery = searchParams.get('q') ?? '';
  const filterStatus = (searchParams.get('status') ?? 'ALL') as InvoiceStatus | 'ALL';
  const filterClientId = searchParams.get('client') ?? 'ALL';

  const searchLower = searchQuery.trim().toLowerCase();
  const filteredInvoices = invoices
    .filter((invoice) => {
      const contract = contracts.find((c) => c.id === invoice.contractId);
      const matchesSearch =
        searchLower.length === 0 ||
        invoice.invoiceNumber.toLowerCase().includes(searchLower) ||
        (contract?.proposalNumber ?? '').toLowerCase().includes(searchLower);
      const matchesStatus = filterStatus === 'ALL' || invoice.status === filterStatus;
      const matchesClient =
        filterClientId === 'ALL' || contract?.clientId === filterClientId;
      return matchesSearch && matchesStatus && matchesClient;
    })
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      try {
        const [invoiceData, contractData] = await Promise.all([
          fetchInvoices(),
          fetchContracts(),
        ]);
        if (!active) return;
        setInvoices(invoiceData);
        setContracts(contractData);
        const contractIds = Array.from(
          new Set(invoiceData.map((invoice) => invoice.contractId))
        );
        const terminsList = (
          await Promise.all(
            contractIds.map((id) => fetchTermins(id).catch(() => []))
          )
        ).flat();
        const nextTerminMap: Record<string, string> = {};
        for (const termin of terminsList) {
          nextTerminMap[termin.id] = termin.terminName;
        }
        if (active) {
          setTerminNameById(nextTerminMap);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (active) setIsLoading(false);
      }
    };
    loadData();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadSettings = async () => {
      try {
        const data = await fetchSettings();
        if (active) setSettings(data);
      } catch (error) {
        console.error(error);
      }
    };
    loadSettings();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadHeader = async () => {
      try {
        const response = await fetch('/invoice-header.png');
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onload = () => {
          if (!active) return;
          setHeaderDataUrl(typeof reader.result === 'string' ? reader.result : '');
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error(error);
      }
    };
    loadHeader();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setVisibleCount(20);
  }, [searchQuery, filterStatus, filterClientId]);

  const setQueryParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === 'ALL') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const nextQuery = params.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    router.replace(nextUrl, { scroll: false });
  };

  const clientOptions = Array.from(
    new Map(
      contracts
        .filter((contract) => contract.client)
        .map((contract) => [contract.clientId, contract.client?.name ?? ''])
    )
  )
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const visibleInvoices = filteredInvoices.slice(0, visibleCount);

  const handleOpenPreview = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsPreviewOpen(true);
  };



  const handleExportExcel = () => {
    const formatDateTime = (value: Date | string) =>
      new Date(value)
        .toLocaleString('en-GB', {
          timeZone: 'Asia/Jakarta',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
        .replace(',', '');

    const rows = filteredInvoices.map((invoice) => {
      const contractInfo = getContractInfo(invoice.contractId);
      return {
        'No. Invoice': invoice.invoiceNumber,
        'Tgl Invoice': formatDate(new Date(invoice.invoiceDate)),
        'No. Proposal': contractInfo.number,
        Termin: terminNameById[invoice.terminId] ?? '',
        Nominal: Number(invoice.amount),
        Status: invoice.status,
        created_at: formatDateTime(invoice.createdAt),
        updated_at: formatDateTime(invoice.updatedAt),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoices');
    const fileName = `invoices-${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName, { bookType: 'xlsx' });
    toast({
      title: 'Export Excel',
      description: 'File Excel sudah diunduh.',
    });
  };

  const getContractById = (contractId: string) =>
    contracts.find((c) => c.id === contractId);

  const formatDateLong = (value: Date | string) =>
    new Date(value).toLocaleDateString('en-US', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

  const formatDateTime = (value: Date | string) =>
    new Date(value)
      .toLocaleString('en-GB', {
        timeZone: 'Asia/Jakarta',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
      .replace(',', '');

  const getInvoicePreviewData = (invoice: Invoice) => {
    const contract = getContractById(invoice.contractId);
    const client = contract?.client;
    const terminName = terminNameById[invoice.terminId] ?? '';
    const submissionCode = contract?.submissionCode ?? '';
    const signer =
      submissionCode === '420'
        ? { name: 'Ontoseno', title: 'Director' }
        : submissionCode === '723'
        ? { name: 'Dimas Tirto Wijayandaru, MM', title: 'President Director' }
        : { name: '', title: '' };
    const descriptionParts = [contract?.contractTitle, terminName].filter(Boolean);
    const description = descriptionParts.join('\n');
    const dpp = Number(invoice.amount);
    const ppnRate = Number(settings?.defaultPpnRate ?? 11);
    const ppn = 0;
    const total = dpp;
    return {
      contractNumber: contract?.proposalNumber ?? '-',
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: formatDateLong(invoice.invoiceDate),
      invoiceDateEnglish: formatDateLong(invoice.invoiceDate),
      clientName: client?.name ?? '-',
      clientAddress: client?.address ?? '-',
      clientPic: client?.picName ?? '-',
      description: description || '-',
      contractTitle: contract?.contractTitle ?? '-',
      terminName: terminName || '-',
      dpp,
      ppn,
      ppnRate,
      total,
      terbilang: terbilang(total).toUpperCase(),
      signerName: signer.name || settings?.defaultSignerName || '',
      signerTitle: signer.title || '',
      companyName: settings?.companyName || 'PT Tiga Garis Terdepan',
      companyAddress: settings?.companyAddress || '',
      companyPhone: settings?.companyPhone || '',
      companyEmail: settings?.companyEmail || '',
      companyLogoUrl: settings?.companyLogoUrl || '',
      createdAt: formatDateTime(invoice.createdAt),
      updatedAt: formatDateTime(invoice.updatedAt),
    };
  };

  const handlePrintInvoice = () => {
    if (!selectedInvoice) return;
    const data = getInvoicePreviewData(selectedInvoice);
    const selectedBank =
      bankOptions.find((option) => option.id === bankOptionId) ?? bankOptions[0];
    const terminLabel = terminNameById[selectedInvoice.terminId] ?? 'Payment';
    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (!printWindow) return;
    const headerUrl = headerDataUrl || `${window.location.origin}/invoice-header.png`;
    const footerUrl = `${window.location.origin}/footer.png`;
    const descriptionHtml = data.description.replace(/\n/g, '<br/>');
    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Invoice ${data.invoiceNumber}</title>
          <style>
              @page { size: A4; margin: 20mm; }
              :root { --primary: #A51E23; --primary-soft: #f7e6e7; --border: #94a3b8; --muted: #6b7280; }
            body { font-family: "Segoe UI", Arial, sans-serif; color: #111; background: #fff; }
            .page { page-break-after: always; position: relative; }
            .header { position: relative; height: 180px; margin-bottom: 18px; }
            .header-bg { position: absolute; inset: 0; background-image: url('${headerUrl}'); background-size: cover; background-position: top center; }
            .header-content { position: relative; padding-top: 175px; }
            .page:last-child { page-break-after: auto; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
            .title { font-size: 18px; font-weight: 700; letter-spacing: 1px; color: var(--primary); text-align: center; }
            .footer-image { margin-top: 32px; width: 100%; height: auto; }
            .meta { display: flex; justify-content: space-between; margin-top: 46px; font-size: 14px; }
            .meta .left { max-width: 60%; }
              .box {
                border: 0.5px solid var(--border);
                border-radius: 8px;
                overflow: hidden;
                box-shadow: none;
                }
              .table,
                .totals,
                .note-table,
                .kw-table {
                width: 100%;
                border-collapse: collapse; /* penting untuk rapihin garis */
                margin-top: 0;
                font-size: 14px;
                border: none; /* ✅ HILANGKAN border luar table */
                }
                
              .table th, .table td { border: none; padding: 8px; vertical-align: top; }
              .table tr + tr td { border-top: 1px solid var(--border); }
              .table th { text-align: left; background: var(--primary-soft); color: var(--primary); }
              .table tbody tr:nth-child(even) { background: #f2f6fc; }
              .right { text-align: right; }
              
              .totals td { border: none; padding: 6px 8px; }
              .totals tr + tr td { border-top: 1px solid var(--border); }
              .note { font-size: 12px; }
              .sign { text-align: right; font-size: 14px; }
              .sign-block { width: 220px; margin-left: auto; text-align: right; }
              .sign-name, .sign-title { display: block; text-align: center; padding-left: 75px; }
              
              .note-table td { border: none; padding: 10px; vertical-align: bottom; }
              .kw-title { text-align: center; font-size: 16px; font-weight: 700; margin-top: 8px; }
              
              .kw-table td { border: none; padding: 8px; vertical-align: top; }
              .kw-table tr + tr td { border-top: 1px solid var(--border); }
              .kw-label { width: 180px; }
            .kw-box { border: 0.5px solid var(--border); padding: 6px 10px; display: inline-block; }
            .kw-amount { font-size: 14px; font-weight: 700; }
            .spacer { height: 100px; }
            .watermark {
              position: absolute;
              inset: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 140px;
              font-weight: 700;
              letter-spacing: 8px;
              color: rgba(0, 0, 0, 0.18);
              pointer-events: none;
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="watermark">INVOICE</div>
            <div class="header">
              <div class="header-bg"></div>
              <div class="header-content">
              </div>
            </div>
              <div style="font-size:14px; margin-top:-10mm;">
              <div>
                <div><strong>To:</strong></div>
                <div><strong>${data.clientName}</strong></div>
                <div>${data.clientAddress}</div>
              </div>
              <div style="margin-top:12px;"><strong>Attn:</strong> ${data.clientPic}</div>
              <div style="margin-top:12px; border-top: 1px solid #111; border-bottom: 1px solid #111; padding: 8px 0;">
                <table style="width:100%; font-size:14px;">
                  <tr>
                    <td style="width:70px;">No</td>
                    <td style="width:10px;">:</td>
                    <td>${data.invoiceNumber}</td>
                      <td style="text-align:right;">Reff</td>
                      <td style="width:6px; text-align:right;">:</td>
                      <td style="width:165px; text-align:right;">${data.contractNumber}</td>
                  </tr>
                  <tr>
                    <td>Date</td>
                    <td>:</td>
                    <td colspan="4">${data.invoiceDateEnglish}</td>
                  </tr>
                </table>
              </div>
              <div style="margin-top:12px;">We would like to request the following payment for:</div>
              <div style="margin-top:6px; font-weight:600; text-decoration: underline;">
                ${data.contractTitle}
              </div>
              <table style="width:100%; margin-top:14px; font-size:14px;">
                <tr>
                  <td style="border-bottom:1px dashed #111; padding:6px 0;">${terminLabel}</td>
                  <td style="border-bottom:1px dashed #111; padding:6px 0; text-align:right;">${formatCurrency(data.dpp)}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0; font-weight:600; border-bottom:3px double #111;">Total</td>
                  <td style="padding:6px 0; text-align:right; font-weight:600; border-bottom:3px double #111;">${formatCurrency(data.dpp)}</td>
                </tr>
              </table>
              <div style="margin-top:10px; font-size:11px; font-style: italic;">
                <div>* The service fee includes the applicable tax (PPH 23).</div>
                <div>* PT Tiga Garis Terdepan does not charge VAT for its services because the Company is a Taxable Entrepreneur (Non PKP).</div>
              </div>
              <div style="margin-top:16px;">Please transfer your payment to account:</div>
              <table style="width:100%; margin-top:6px; font-size:14px;">
                <tr><td style="width:80px;">Name</td><td style="width:10px;">:</td><td>${data.companyName}</td></tr>
                <tr><td>NPWP</td><td>:</td><td>0962.4348.8201.4000</td></tr>
                <tr><td>Bank</td><td>:</td><td>${selectedBank.bank}</td></tr>
                <tr><td>Branch</td><td>:</td><td>${selectedBank.branch}</td></tr>
                <tr><td>A/C</td><td>:</td><td>${selectedBank.account}</td></tr>
              </table>
              <div style="margin-top:18px; text-align:left;">
                <div>Thank you for your kind attention and co-operation</div>
                <div>Your faithfully,</div>
                <div style="margin-top:100px;">${data.signerName}</div>
                <div>${data.signerTitle}</div>
              </div>
            </div>
            <img class="footer-image" src="${footerUrl}" alt="Footer" />
          </div>
          <div class="page">
              <div class="header">
                <div class="header-bg"></div>
                <div class="header-content">
                    <div class="title">KUITANSI</div>
                </div>
              </div>
              <div class="box" style="margin-top:24px;">
              <table class="kw-table">
              <tr>
                <td class="kw-label">No:</td>
                <td>${data.invoiceNumber}</td>
              </tr>
              <tr>
                <td class="kw-label">TELAH DITERIMA DARI:</td>
                <td>${data.clientName}</td>
              </tr>
              <tr>
                <td class="kw-label">UANG SEJUMLAH:</td>
                <td><span class="kw-box">#${data.terbilang} RUPIAH#</span></td>
              </tr>
              <tr>
                <td class="kw-label">UNTUK PEMBAYARAN:</td>
                <td>${descriptionHtml}</td>
              </tr>
              <tr>
                <td class="kw-label">JUMLAH:</td>
                <td class="kw-amount">${formatCurrency(data.dpp)}</td>
              </tr>
              <tr>
                <td></td>
                <td class="sign">
                  <div class="sign-block">
                    <div>Jakarta, 16 Januari 2026</div>
                    <div class="spacer"></div>
                    <div class="sign-name">${data.signerName}</div>
                    <div class="sign-title">${data.signerTitle}</div>
                  </div>
                </td>
              </tr>
              </table>
              </div>
          </div>
        </body>
      </html>
    `;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const getInvoiceStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case 'PAID':
        return 'bg-success text-success-foreground';
      case 'ISSUED':
        return 'bg-primary text-primary-foreground';
      case 'DRAFT':
        return 'bg-muted text-muted-foreground';
      case 'VOID':
        return 'bg-destructive text-destructive-foreground';
      default:
        return '';
    }
  };

  const getContractInfo = (contractId: string) => {
    const contract = contracts.find((c) => c.id === contractId);
    return contract
      ? { number: contract.proposalNumber, client: contract.client?.name }
      : { number: '-', client: '-' };
  };

  if (isLoading) {
    return (
      <AdminLayout title="Invoices">
        <InvoicesSkeleton />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Invoices">
      <Card>
        <CardHeader className="flex flex-col gap-3 space-y-0 pb-4 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-xl">Daftar Invoices</CardTitle>
          <div className="grid w-full gap-2 md:w-auto md:items-center">
            <Button variant="outline" onClick={handleExportExcel} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col gap-3 mb-4 md:flex-row md:items-center md:gap-4">
            <div className="relative w-full md:flex-1 md:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari nomor invoice/contract..."
                value={searchQuery}
                onChange={(e) => setQueryParam('q', e.target.value.trim())}
                className="pl-9"
              />
            </div>
            <Select
              value={filterClientId}
              onValueChange={(value) => setQueryParam('client', value)}
            >
              <SelectTrigger className="w-full md:w-[220px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Client</SelectItem>
                {clientOptions.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filterStatus}
              onValueChange={(value) => setQueryParam('status', value)}
            >
              <SelectTrigger className="w-full md:w-[150px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="ISSUED">Issued</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="VOID">Void</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Invoice</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Contract</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Receipt className="w-8 h-8" />
                          <p>Tidak ada invoice ditemukan</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    visibleInvoices.map((invoice) => {
                      const contractInfo = getContractInfo(invoice.contractId);
                      return (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-mono font-medium">
                            {invoice.invoiceNumber}
                          </TableCell>
                          <TableCell>{formatDate(new Date(invoice.invoiceDate))}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {contractInfo.number}
                          </TableCell>
                          <TableCell>{contractInfo.client}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(invoice.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge className={getInvoiceStatusColor(invoice.status)}>
                              {invoice.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" onClick={() => handleOpenPreview(invoice)}>
                              <Printer className="w-4 h-4 mr-2" />
                              Print
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="space-y-3 p-4 md:hidden">
              {filteredInvoices.length === 0 ? (
                <div className="flex flex-col items-center gap-2 text-muted-foreground py-8">
                  <Receipt className="w-8 h-8" />
                  <p>Tidak ada invoice ditemukan</p>
                </div>
              ) : (
                visibleInvoices.map((invoice) => {
                  const contractInfo = getContractInfo(invoice.contractId);
                  return (
                    <div key={invoice.id} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground">No. Invoice</p>
                          <p className="font-mono text-sm font-medium">
                            {invoice.invoiceNumber}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">Contract</p>
                          <p className="font-mono text-sm">{contractInfo.number}</p>
                          <p className="text-xs text-muted-foreground mt-2">Client</p>
                          <p className="text-sm">{contractInfo.client}</p>
                        </div>
                        <Badge className={getInvoiceStatusColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {formatDate(new Date(invoice.invoiceDate))}
                        </span>
                        <span className="font-medium">
                          {formatCurrency(invoice.amount)}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-end">
                        <Button variant="outline" size="sm" onClick={() => handleOpenPreview(invoice)}>
                          <Printer className="w-4 h-4 mr-2" />
                          Print
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {visibleInvoices.length < filteredInvoices.length && (
              <div className="flex justify-center p-4">
                <Button
                  variant="outline"
                  onClick={() => setVisibleCount((prev) => prev + 20)}
                >
                  Load More
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={isPreviewOpen}
        onOpenChange={(open) => {
          setIsPreviewOpen(open);
          if (!open) setSelectedInvoice(null);
        }}
      >
        <DialogContent className="sm:max-w-[900px] h-[85vh] bg-muted p-0 grid grid-rows-[auto,1fr,auto]">
          <DialogHeader className="bg-muted/95 px-6 py-4 backdrop-blur">
            <DialogTitle>Preview Invoice</DialogTitle>
            <DialogDescription>
              Pastikan data sudah sesuai sebelum print.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-auto px-6 pb-6">
            {selectedInvoice && (
              <InvoicePreview
                invoice={selectedInvoice}
                data={getInvoicePreviewData(selectedInvoice)}
                headerSrc={headerDataUrl || "/invoice-header.png"}
                bankOptions={bankOptions}
                bankOptionId={bankOptionId}
                onBankChange={setBankOptionId}
              />
            )}
          </div>
          <DialogFooter className="gap-2 bg-muted/95 px-6 py-4 backdrop-blur border-t">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Tutup
            </Button>
            <Button onClick={handlePrintInvoice}>Print</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

interface InvoicePreviewData {
  contractNumber: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceDateEnglish: string;
  clientName: string;
  clientAddress: string;
  clientPic: string;
  description: string;
  contractTitle: string;
  terminName: string;
  dpp: number;
  ppn: number;
  ppnRate: number;
  total: number;
  terbilang: string;
  signerName: string;
  signerTitle: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyLogoUrl: string;
  createdAt: string;
  updatedAt: string;
}

function InvoicePreview({
  invoice,
  data,
  headerSrc,
  bankOptions,
  bankOptionId,
  onBankChange,
}: {
  invoice: Invoice;
  data: InvoicePreviewData;
  headerSrc: string;
  bankOptions: Array<{ id: string; bank: string; branch: string; account: string }>;
  bankOptionId: string;
  onBankChange: (value: string) => void;
}) {
  const footerSrc = "/footer.png";
  const selectedBank =
    bankOptions.find((option) => option.id === bankOptionId) ?? bankOptions[0];
  return (
    <div className="space-y-8 rounded-md bg-white p-6 text-black">
        <div className="relative space-y-4">
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="text-8xl font-bold tracking-[0.4em] text-black/20">INVOICE</span>
            </div>
            <div className="relative h-44">
                <div
                className="absolute inset-0 bg-cover bg-top"
                style={{ backgroundImage: `url(${headerSrc})` }}
                />
            </div>
          <div className="mt-2 text-sm -mt-6">
            <div className="flex flex-col gap-4 md:flex-row md:justify-between">
              <div className="space-y-1">
                <p className="font-semibold">To:</p>
                <p className="font-semibold">{data.clientName}</p>
                <p>{data.clientAddress}</p>
                <p className="pt-2 font-semibold">Attn: {data.clientPic}</p>
              </div>
              <div className="text-left md:text-right">
                <div className="inline-block text-left">
                  <div className="flex items-center gap-2">
                    <span className="min-w-[80px] font-semibold">No</span>
                    <span className="w-3 text-center">:</span>
                    <span>{data.invoiceNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="min-w-[80px] font-semibold">Date</span>
                    <span className="w-3 text-center">:</span>
                    <span>{data.invoiceDateEnglish}</span>
                  </div>
                    <div className="flex items-center gap-1 justify-end text-right">
                      <span className="min-w-[36px] font-semibold">Reff</span>
                    <span className="w-2 text-center">:</span>
                    <span>{data.contractNumber}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-3 border-b border-t border-[#A51E23] py-2">
              We would like to request the following payment for:
            </div>
            <div className="mt-2 font-semibold underline">{data.contractTitle}</div>
            <div className="mt-4">
              <div className="flex items-center justify-between border-b border-dashed border-[#A51E23] py-2">
                <span>{data.terminName}</span>
                <span>{formatCurrency(data.dpp)}</span>
              </div>
              <div className="flex items-center justify-between py-2 font-semibold">
                <span>Total</span>
                <span>{formatCurrency(data.dpp)}</span>
              </div>
              <div className="border-t-4 border-double border-[#A51E23]" />
            </div>
            <div className="mt-2 text-[10px] italic">
              <div>* The service fee includes the applicable tax (PPH 23).</div>
              <div>
                * PT Tiga Garis Terdepan does not charge VAT for its services because the
                Company is a Taxable Entrepreneur (Non PKP).
              </div>
            </div>
            <div className="mt-4 text-sm">
              <div>Please transfer your payment to account:</div>
              <div className="mt-2 max-w-sm">
                <Select value={bankOptionId} onValueChange={onBankChange}>
                  <SelectTrigger className="bg-white text-black border-slate-300">
                    <SelectValue placeholder="Pilih rekening" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-black">
                    {bankOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.bank} - {option.branch}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-3 space-y-1">
                <div className="flex gap-2">
                  <span className="w-16">Name</span>
                  <span>:</span>
                  <span>{data.companyName}</span>
                </div>
                <div className="flex gap-2">
                  <span className="w-16">NPWP</span>
                  <span>:</span>
                  <span>0962.4348.8201.4000</span>
                </div>
                <div className="flex gap-2">
                  <span className="w-16">Bank</span>
                  <span>:</span>
                  <span>{selectedBank.bank}</span>
                </div>
                <div className="flex gap-2">
                  <span className="w-16">Branch</span>
                  <span>:</span>
                  <span>{selectedBank.branch}</span>
                </div>
                <div className="flex gap-2">
                  <span className="w-16">A/C</span>
                  <span>:</span>
                  <span>{selectedBank.account}</span>
                </div>
              </div>
            </div>
            <div className="mt-6 text-sm text-left">
              <p>Thank you for your kind attention and co-operation</p>
              <p>Your faithfully,</p>
              <div className="mt-6 h-16" />
              <div>
                <p>{data.signerName}</p>
                <p>{data.signerTitle}</p>
              </div>
            </div>
          </div>
          <img src={footerSrc} alt="Footer" className="mt-8 w-full" />
        </div>

      <div className="space-y-4">
          <div className="relative h-44">
            <img
              className="absolute inset-0 h-full w-full object-cover object-top"
              src={headerSrc}
              alt="Invoice header"
            />
          </div>
          <div className="mt-4 flex items-center justify-between">
            <h3 className="text-lg font-bold tracking-wide text-[#A51E23] text-center">KUITANSI</h3>
          </div>
        <div className="mt-4 overflow-auto rounded-md border border-slate-300">
          <table className="w-full text-sm">
            <tbody>
              <tr>
                  <td className="border-b border-slate-300 p-2 w-[180px]">No:</td>
                  <td className="border-b border-slate-300 p-2">{invoice.invoiceNumber}</td>
                </tr>
                <tr>
                  <td className="border-b border-slate-300 p-2">TELAH DITERIMA DARI:</td>
                  <td className="border-b border-slate-300 p-2">{data.clientName}</td>
                </tr>
                <tr>
                  <td className="border-b border-slate-300 p-2">UANG SEJUMLAH:</td>
                  <td className="border-b border-slate-300 p-2 font-semibold">
                    #{data.terbilang} RUPIAH#
                  </td>
                </tr>
                <tr>
                  <td className="border-b border-slate-300 p-2">UNTUK PEMBAYARAN:</td>
                  <td className="border-b border-slate-300 p-2 whitespace-pre-line">
                    {data.description}
                  </td>
                </tr>
                <tr>
                  <td className="border-b border-slate-300 p-2">JUMLAH:</td>
                  <td className="border-b border-slate-300 p-2 font-semibold">
                    {formatCurrency(data.dpp)}
                  </td>
                </tr>
                <tr>
                  <td className="border-b border-slate-300 p-2"></td>
                  <td className="border-b border-slate-300 p-2 text-right">
                    <div className="ml-auto w-56 text-right">
                      <p>Jakarta, 16 Januari 2026</p>
                      <div className="h-40" />
                      <p className="text-center pl-4">{data.signerName}</p>
                      <p className="text-center pl-4">{data.signerTitle}</p>
                    </div>
                  </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function InvoicesSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 space-y-0 pb-4 md:flex-row md:items-center md:justify-between">
        <Skeleton className="h-6 w-44" />
        <div className="grid w-full gap-2 md:w-auto md:grid-cols-2 md:items-center">
          <Skeleton className="h-9 w-full md:w-28" />
          <Skeleton className="h-9 w-full md:w-32" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 mb-4 md:flex-row md:items-center md:gap-4">
          <Skeleton className="h-10 w-full md:max-w-sm" />
          <Skeleton className="h-10 w-full md:w-36" />
        </div>
        <div className="rounded-md border">
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-6 w-full" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

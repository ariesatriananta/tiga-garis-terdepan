import type {
  Client,
  Contract,
  Termin,
  Invoice,
  Letter,
  LetterAssignment,
  LetterAssignmentMember,
} from '@/types';

// Sample Clients
export const mockClients: Client[] = [
  {
    id: '1',
    name: 'PT Astra Prima Indonesiaaaa',
    code: '2',
    npwp: '12.345.678.9-012.345',
    address: 'Jl. Sudirman No. 123, Jakarta Pusat',
    picName: 'Budi Santoso',
    email: 'budi@astraprima.co.id',
    phone: '021-5551234',
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    name: 'PT Berkah Mandiri Sejahtera',
    code: '3',
    npwp: '98.765.432.1-987.654',
    address: 'Jl. Gatot Subroto No. 45, Jakarta Selatan',
    picName: 'Siti Rahayu',
    email: 'siti@berkahms.com',
    phone: '021-5559876',
    isActive: true,
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-02-20')
  },
  {
    id: '3',
    name: 'CV Cahaya Nusantara',
    code: '4',
    npwp: '11.222.333.4-555.666',
    address: 'Jl. Pemuda No. 78, Surabaya',
    picName: 'Ahmad Wijaya',
    email: 'ahmad@cahayanusantara.id',
    phone: '031-5557890',
    isActive: true,
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-03-10')
  },
  {
    id: '4',
    name: 'PT Delta Konsultan',
    code: '1',
    npwp: '44.555.666.7-888.999',
    address: 'Jl. Diponegoro No. 12, Bandung',
    picName: 'Dewi Lestari',
    email: 'dewi@deltakonsultan.co.id',
    phone: '022-5554321',
    isActive: false,
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-06-15')
  },
  {
    id: '5',
    name: 'PT Energi Lestari',
    code: '5',
    npwp: '55.666.777.8-999.000',
    address: 'Jl. Rasuna Said No. 56, Jakarta Selatan',
    picName: 'Eko Prasetyo',
    email: 'eko@energilestari.com',
    phone: '021-5558765',
    isActive: true,
    createdAt: new Date('2024-04-01'),
    updatedAt: new Date('2024-04-01')
  }
];

// Sample Contracts
export const mockContracts: Contract[] = [
  {
    id: '1',
    proposalDate: new Date('2026-01-01'),
    clientId: '1',
    client: mockClients[0],
    serviceCode: 'A',
    submissionCode: '420',
    engagementNo: 1,
    seqNo: 1,
    proposalNumber: 'P.001/TGT-A.420/XII/2024',
    contractTitle: 'Audit Laporan Keuangan 2024',
    contractValue: 150000000,
    paymentStatus: 'PARTIAL',
    status: 'ACTIVE',
    notes: 'Audit tahunan untuk laporan keuangan',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01')
  },
  {
    id: '2',
    proposalDate: new Date('2026-01-02'),
    clientId: '2',
    client: mockClients[1],
    serviceCode: 'B',
    submissionCode: '420',
    engagementNo: 1,
    seqNo: 2,
    proposalNumber: 'P.002/TGT-B.420/XII/2024',
    contractTitle: 'Review Sistem Pengendalian Internal',
    contractValue: 85000000,
    paymentStatus: 'UNPAID',
    status: 'ACTIVE',
    createdAt: new Date('2026-01-02'),
    updatedAt: new Date('2026-01-02')
  },
  {
    id: '3',
    proposalDate: new Date('2026-01-03'),
    clientId: '1',
    client: mockClients[0],
    serviceCode: 'A',
    submissionCode: '420',
    engagementNo: 2,
    seqNo: 3,
    proposalNumber: 'P.003/TGT-A.420/XII/2024',
    contractTitle: 'Audit Special Purpose 2024',
    contractValue: 75000000,
    paymentStatus: 'PAID',
    status: 'ACTIVE',
    createdAt: new Date('2026-01-03'),
    updatedAt: new Date('2026-01-03')
  },
  {
    id: '4',
    proposalDate: new Date('2026-01-07'),
    clientId: '3',
    client: mockClients[2],
    serviceCode: 'B',
    submissionCode: '420',
    engagementNo: 1,
    seqNo: 5,
    proposalNumber: 'P.005/TGT-B.420/XI/2024',
    contractTitle: 'Due Diligence Akuisisi',
    contractValue: 200000000,
    paymentStatus: 'PARTIAL',
    status: 'ACTIVE',
    createdAt: new Date('2026-01-07'),
    updatedAt: new Date('2026-01-07')
  },
  {
    id: '5',
    proposalDate: new Date('2026-01-10'),
    clientId: '5',
    client: mockClients[4],
    serviceCode: 'A',
    submissionCode: '420',
    engagementNo: 1,
    seqNo: 3,
    proposalNumber: 'P.003/TGT-A.420/X/2024',
    contractTitle: 'Audit Laporan Keuangan 2023',
    contractValue: 120000000,
    paymentStatus: 'PAID',
    status: 'ACTIVE',
    createdAt: new Date('2026-01-10'),
    updatedAt: new Date('2026-01-10')
  }
];

// Sample Termins
export const mockTermins: Termin[] = [
  {
    id: '1',
    contractId: '1',
    terminName: 'DP 30%',
    terminAmount: 45000000,
    dueDate: new Date('2026-01-04'),
    status: 'PAID',
    paymentReceivedDate: new Date('2026-01-04'),
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-04')
  },
  {
    id: '2',
    contractId: '1',
    terminName: 'Termin 2 (40%)',
    terminAmount: 60000000,
    dueDate: new Date('2026-01-06'),
    status: 'INVOICED',
    invoiceId: '1',
    createdAt: new Date('2026-01-02'),
    updatedAt: new Date('2026-01-06')
  },
  {
    id: '3',
    contractId: '1',
    terminName: 'Pelunasan (30%)',
    terminAmount: 45000000,
    dueDate: new Date('2026-01-10'),
    status: 'PENDING',
    createdAt: new Date('2026-01-03'),
    updatedAt: new Date('2026-01-03')
  },
  {
    id: '4',
    contractId: '3',
    terminName: 'Full Payment',
    terminAmount: 75000000,
    status: 'PAID',
    paymentReceivedDate: new Date('2026-01-05'),
    createdAt: new Date('2026-01-03'),
    updatedAt: new Date('2026-01-05')
  },
  {
    id: '5',
    contractId: '4',
    terminName: 'DP 50%',
    terminAmount: 100000000,
    dueDate: new Date('2026-01-08'),
    status: 'PAID',
    paymentReceivedDate: new Date('2026-01-08'),
    createdAt: new Date('2026-01-07'),
    updatedAt: new Date('2026-01-08')
  },
  {
    id: '6',
    contractId: '4',
    terminName: 'Pelunasan 50%',
    terminAmount: 100000000,
    dueDate: new Date('2026-01-10'),
    status: 'PENDING',
    createdAt: new Date('2026-01-07'),
    updatedAt: new Date('2026-01-07')
  }
];

// Sample Invoices
export const mockInvoices: Invoice[] = [
  {
    id: '1',
    invoiceDate: new Date('2026-01-06'),
    contractId: '1',
    terminId: '2',
    seqNo: 2,
    invoiceNumber: 'I.002/TGT-A.420/XII/2024',
    amount: 60000000,
    status: 'ISSUED',
    createdAt: new Date('2026-01-06'),
    updatedAt: new Date('2026-01-06')
  },
  {
    id: '2',
    invoiceDate: new Date('2026-01-04'),
    contractId: '1',
    terminId: '1',
    seqNo: 1,
    invoiceNumber: 'I.001/TGT-A.420/XII/2024',
    amount: 45000000,
    status: 'PAID',
    createdAt: new Date('2026-01-04'),
    updatedAt: new Date('2026-01-04')
  }
];

// Sample Letters
export const mockLetters: Letter[] = [
  {
    id: '1',
    letterDate: new Date('2026-01-04'),
    clientId: '1',
    client: mockClients[0],
    letterType: 'HRGA',
    hrgaCategory: 'PERMANEN',
    subject: 'Surat Penugasan Tim Audit',
    seqNo: 1,
    letterNumber: '001/TGT-A.420/Employee-A/XII/2024',
    status: 'ACTIVE',
    createdAt: new Date('2026-01-04'),
    updatedAt: new Date('2026-01-04')
  },
  {
    id: '2',
    letterDate: new Date('2026-01-08'),
    clientId: '2',
    client: mockClients[1],
    letterType: 'UMUM',
    subject: 'Konfirmasi Pembayaran Termin 1',
    seqNo: 2,
    letterNumber: 'L.002/TGT-A.420/XII/2024',
    status: 'ACTIVE',
    createdAt: new Date('2026-01-08'),
    updatedAt: new Date('2026-01-08')
  },
  {
    id: '3',
    letterDate: new Date('2026-01-09'),
    clientId: '3',
    client: mockClients[2],
    letterType: 'SURAT_TUGAS',
    subject: 'Pengiriman Dokumen Audit',
    seqNo: 3,
    letterNumber: 'L.003/TGT-A.420/XII/2024',
    status: 'ACTIVE',
    createdAt: new Date('2026-01-09'),
    updatedAt: new Date('2026-01-09')
  }
];

export const mockLetterAssignments: LetterAssignment[] = [
  {
    id: '1',
    letterId: '3',
    title: 'Penugasan Jasa Audit Laporan Keuangan',
    auditPeriodText: 'Untuk Tahun yang Berakhir 31 Desember 2024',
    createdAt: new Date('2026-01-09'),
    updatedAt: new Date('2026-01-09'),
  },
];

export const mockLetterAssignmentMembers: LetterAssignmentMember[] = [
  {
    id: '1',
    assignmentId: '1',
    name: 'Nama',
    role: 'Rekan Penanggung Jawab',
    order: 1,
    createdAt: new Date('2026-01-09'),
    updatedAt: new Date('2026-01-09'),
  },
  {
    id: '2',
    assignmentId: '1',
    name: 'Nama',
    role: 'Manajer',
    order: 2,
    createdAt: new Date('2026-01-09'),
    updatedAt: new Date('2026-01-09'),
  },
  {
    id: '3',
    assignmentId: '1',
    name: 'Nama',
    role: 'Ketua Tim',
    order: 3,
    createdAt: new Date('2026-01-09'),
    updatedAt: new Date('2026-01-09'),
  },
  {
    id: '4',
    assignmentId: '1',
    name: 'Nama',
    role: 'Anggota Tim',
    order: 4,
    createdAt: new Date('2026-01-09'),
    updatedAt: new Date('2026-01-09'),
  },
  {
    id: '5',
    assignmentId: '1',
    name: 'Nama',
    role: 'Anggota Tim',
    order: 5,
    createdAt: new Date('2026-01-09'),
    updatedAt: new Date('2026-01-09'),
  },
];

// Dashboard KPI calculation
export const getDashboardKPI = () => {
  const activeContracts = mockContracts.filter(c => c.status === 'ACTIVE');
  const totalContractValue = activeContracts.reduce((sum, c) => sum + c.contractValue, 0);
  
  const paidTermins = mockTermins.filter(t => t.status === 'PAID');
  const totalPaymentReceived = paidTermins.reduce((sum, t) => sum + t.terminAmount, 0);
  
  const pendingTermins = mockTermins.filter(t => t.status === 'PENDING' || t.status === 'INVOICED');
  const pendingPayments = pendingTermins.reduce((sum, t) => sum + t.terminAmount, 0);

  return {
    totalContracts: activeContracts.length,
    totalContractValue,
    totalPaymentReceived,
    pendingPayments
  };
};

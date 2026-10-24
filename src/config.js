// Static settings for the gate-pass email. Edit here if recipients or defaults change.
export const EMAIL = {
  to: ['HO_Admin@bajajautocredit.com'],
  // Always copied. The selected department's head is added in front of these.
  cc: [
    'hareshwarthatte@bajajautocredit.com',
    'prathameshmali@bajajautocredit.com',
  ],
  subject: 'Gate Pass Required',
};

// Picking a department adds its head to Cc and makes them the default "Meeting with".
export const DEPARTMENTS = [
  { id: 'LOS', head: 'Rohit Budhe', email: 'rohitbudhe@bajajautocredit.com' },
  { id: 'LMS', head: 'Debesh Kumal Pal', email: 'debeshpal@bajajautocredit.com' },
  { id: 'Core', head: 'Shailesh Daterao', email: 'ssdaterao@bajajautocredit.com' },
  { id: 'Infra', head: 'Dhiraj Sinha', email: 'dhirajsinha@bajajautocredit.com' },
  { id: 'InfoSec', head: 'Hemant Kumar', email: 'hemantkumar@bajajautocredit.com' },
];

export const DEFAULTS = {
  timeFrom: '10:00',
  timeTo: '17:30',
  purpose: 'Meeting',
  department: 'LOS',
};

export const departmentById = (id) => DEPARTMENTS.find((d) => d.id === id) ?? DEPARTMENTS[0];

export const LIMITS = {
  org: 100,
  name: 60,
  text: 100,
  maxVisitors: 20,
};

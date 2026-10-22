// Static settings for the gate-pass email. Edit here if recipients or defaults change.
export const EMAIL = {
  to: ['HO_Admin@bajajautocredit.com'],
  cc: [
    'rohitbudhe@bajajautocredit.com',
    'ynt_pranitmathe@bajajautocredit.com',
    'hareshwarthatte@bajajautocredit.com',
    'prathameshmali@bajajautocredit.com',
  ],
  subject: 'Gate Pass Required',
};

export const DEFAULTS = {
  org: 'Salesforce',
  visitorName: 'John Doe',
  timeFrom: '10:00',
  timeTo: '17:30',
  purpose: 'Meeting',
  meetingWith: 'Rohit Budhe',
};

export const LIMITS = {
  org: 100,
  name: 60,
  text: 100,
  maxVisitors: 20,
};

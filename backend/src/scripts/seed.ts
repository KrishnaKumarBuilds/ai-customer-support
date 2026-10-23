import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Category } from '../models/Category';
import { SLA } from '../models/SLA';
import { Ticket, TicketStatus, TicketPriority, TicketSentiment } from '../models/Ticket';
import { Message } from '../models/Message';
import { Feedback } from '../models/Feedback';
import { Notification } from '../models/Notification';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/supportiq';

const sampleTicketData = [
  { subject: 'Production database cluster is completely unresponsive', description: 'Our main MongoDB cluster stopped responding 30 minutes ago. All API endpoints returning HTTP 500. Revenue impact is critical.', category: 'Technical Issue', priority: 'CRITICAL' as TicketPriority, sentiment: 'Negative' as TicketSentiment },
  { subject: 'Critical security vulnerability: IDOR in user profile endpoint', description: 'We discovered any authenticated user can view other customers private data by manipulating user ID in URL.', category: 'Security', priority: 'CRITICAL' as TicketPriority, sentiment: 'Negative' as TicketSentiment },
  { subject: 'Double charge on annual Enterprise invoice', description: 'Our corporate Visa was charged $24,000 twice for invoice INV-9021. Please reverse the duplicate charge immediately.', category: 'Billing', priority: 'HIGH' as TicketPriority, sentiment: 'Negative' as TicketSentiment },
  { subject: 'Stripe payment gateway failing for all transactions', description: 'Checkout has been blocked for 40 minutes. Customers see Payment processor unavailable at checkout. We are losing revenue.', category: 'Payment', priority: 'CRITICAL' as TicketPriority, sentiment: 'Negative' as TicketSentiment },
  { subject: 'SSO SAML failure with Okta integration', description: 'Our enterprise Okta SAML integration broke this morning. 200 employees cannot log into the system. Error: Invalid SAML Response Signature.', category: 'Login', priority: 'HIGH' as TicketPriority, sentiment: 'Negative' as TicketSentiment },
  { subject: 'Account locked after too many failed 2FA attempts', description: 'I entered wrong authenticator code 3 times and now the account is permanently locked. I need my 2FA reset urgently.', category: 'Account', priority: 'HIGH' as TicketPriority, sentiment: 'Negative' as TicketSentiment },
  { subject: 'Application crashes on iOS 17 app startup', description: 'Version 4.2.1 of your mobile app crashes immediately on splash screen on iOS 17.4 devices. All iOS users are affected.', category: 'Product Issue', priority: 'HIGH' as TicketPriority, sentiment: 'Negative' as TicketSentiment },
  { subject: 'Request: Native dark mode for agent console', description: 'Our support agents spend 8 hours a day staring at bright white screens. Please prioritize an eye-friendly dark theme mode.', category: 'Feature Request', priority: 'LOW' as TicketPriority, sentiment: 'Positive' as TicketSentiment },
  { subject: 'Support agent was rude and closed ticket without resolving', description: 'Agent marked ticket resolved without providing any solution or waiting for my confirmation. Extremely unprofessional behavior.', category: 'Complaint', priority: 'HIGH' as TicketPriority, sentiment: 'Negative' as TicketSentiment },
  { subject: 'Refund request for unused seats on annual plan', description: 'We downsized our team by 5 seats last month. We would like a prorated credit for the remaining 8 months.', category: 'Billing', priority: 'MEDIUM' as TicketPriority, sentiment: 'Neutral' as TicketSentiment },
  { subject: 'How to configure custom domain with SSL', description: 'We purchased support.ourdomain.com and want to know how to route it to your platform with Cloudflare SSL.', category: 'Technical Issue', priority: 'MEDIUM' as TicketPriority, sentiment: 'Neutral' as TicketSentiment },
  { subject: 'Payment card expired and automated payment failing', description: 'Our corporate card on file expired yesterday. We updated it but the automated retry still failed and says subscription is past due.', category: 'Payment', priority: 'HIGH' as TicketPriority, sentiment: 'Negative' as TicketSentiment },
  { subject: 'Data export corrupted for records over 10k', description: 'Whenever we run a CSV export with more than 10,000 records, the downloaded file is 0 bytes or corrupted with missing columns.', category: 'Product Issue', priority: 'HIGH' as TicketPriority, sentiment: 'Negative' as TicketSentiment },
  { subject: 'Feature request: Jira integration for bug tracking', description: 'We want tickets tagged as Bug to automatically create an issue in our Jira Software project with ticket link and description.', category: 'Feature Request', priority: 'MEDIUM' as TicketPriority, sentiment: 'Positive' as TicketSentiment },
  { subject: 'Webhook delivery failing with ECONNREFUSED', description: 'Our webhook receiver is receiving zero webhooks. In the dashboard they all show failed with connection refused.', category: 'Technical Issue', priority: 'HIGH' as TicketPriority, sentiment: 'Negative' as TicketSentiment },
  { subject: 'Inquiry about enterprise licensing discounts', description: 'We are considering rolling out your software to 350 customer service reps. Can we speak with a sales representative about volume pricing?', category: 'Other', priority: 'LOW' as TicketPriority, sentiment: 'Positive' as TicketSentiment },
  { subject: 'Session expires every 5 minutes requiring constant re-login', description: 'Our agents are being logged out every 5-10 minutes while actively typing replies, losing their draft work.', category: 'Login', priority: 'HIGH' as TicketPriority, sentiment: 'Negative' as TicketSentiment },
  { subject: 'Suspicious brute force attack on admin portal', description: 'Firewall detected over 10,000 failed login attempts against admin login from a bulletproof hosting provider within 15 minutes.', category: 'Security', priority: 'CRITICAL' as TicketPriority, sentiment: 'Negative' as TicketSentiment },
  { subject: 'Table pagination broken when sorting by created date', description: 'In the tickets table, clicking Next Page when sorted by Created At ascending resets the sort to descending and reloads page 1.', category: 'Product Issue', priority: 'MEDIUM' as TicketPriority, sentiment: 'Negative' as TicketSentiment },
  { subject: 'Feature request: Custom SLA policies by customer tier', description: 'We need different SLA response times for Enterprise VIP customers (1 hour) versus Basic tier customers (12 hours).', category: 'Feature Request', priority: 'MEDIUM' as TicketPriority, sentiment: 'Positive' as TicketSentiment },
  { subject: 'Password reset link returns 404 error', description: 'I am trying to reset the master admin password but the email link redirects to a 404 page. Our team is locked out.', category: 'Login', priority: 'HIGH' as TicketPriority, sentiment: 'Negative' as TicketSentiment },
  { subject: 'Rate limit error 429 on standard API queries', description: 'Our read-only sync script is receiving HTTP 429 Too Many Requests even though we are well below our contracted 100 req/sec quota.', category: 'Technical Issue', priority: 'MEDIUM' as TicketPriority, sentiment: 'Negative' as TicketSentiment },
  { subject: 'Request to change company billing entity and tax ID', description: 'We updated our registered corporate entity name and need our VAT/GST tax ID updated on all future invoices.', category: 'Billing', priority: 'MEDIUM' as TicketPriority, sentiment: 'Neutral' as TicketSentiment },
  { subject: 'XSS vulnerability in ticket comment parser', description: 'Submitting HTML tags inside markdown code blocks results in script execution in the agent console. Critical security fix required.', category: 'Security', priority: 'CRITICAL' as TicketPriority, sentiment: 'Negative' as TicketSentiment },
  { subject: 'Google OAuth login redirects to blank white page', description: 'Clicking Sign in with Google opens the consent popup, but after authenticating it closes and leaves the app on an empty blank screen.', category: 'Login', priority: 'HIGH' as TicketPriority, sentiment: 'Negative' as TicketSentiment },
  { subject: 'Thank you for the quick resolution on the incident!', description: 'Just wanted to send a note of appreciation to Sarah from technical support. She identified and fixed our webhook serialization bug in under 15 minutes!', category: 'Other', priority: 'LOW' as TicketPriority, sentiment: 'Positive' as TicketSentiment },
  { subject: 'Emergency: Database disk space exhausted, writes failing', description: 'Our MongoDB primary has 0MB free disk space. All write operations, ticket updates, and customer submissions are failing.', category: 'Technical Issue', priority: 'CRITICAL' as TicketPriority, sentiment: 'Negative' as TicketSentiment },
  { subject: 'Bulk ticket import fails with UTF-8 encoding error', description: 'We attempted to import 500 historical tickets from Zendesk via CSV. The importer errors out stating invalid character encoding.', category: 'Product Issue', priority: 'MEDIUM' as TicketPriority, sentiment: 'Negative' as TicketSentiment },
  { subject: 'Feature request: Bulk reassignment to another agent', description: 'When an agent goes on sick leave, managers need a way to bulk reassign 50+ tickets to another available agent in 1 click.', category: 'Feature Request', priority: 'MEDIUM' as TicketPriority, sentiment: 'Positive' as TicketSentiment },
  { subject: 'DDoS attack mitigation assistance needed urgently', description: 'Our public customer portal is receiving 250,000 requests per minute from a distributed botnet. Need Cloudflare rate limiting rules enabled immediately.', category: 'Security', priority: 'CRITICAL' as TicketPriority, sentiment: 'Negative' as TicketSentiment },
  { subject: 'Invoice PDF download produces blank white page', description: 'Clicking Download PDF for past invoices generates an empty file. Our accounting team cannot file tax returns without receipts.', category: 'Billing', priority: 'MEDIUM' as TicketPriority, sentiment: 'Negative' as TicketSentiment },
  { subject: 'Agent workload distribution is uneven', description: 'Certain tier 1 agents have 35 active tickets while others have only 2. The auto-routing algorithm seems to be ignoring active load.', category: 'Technical Issue', priority: 'MEDIUM' as TicketPriority, sentiment: 'Negative' as TicketSentiment },
  { subject: 'CSAT survey customization feature request', description: 'Allow us to collect 1-5 star ratings and comments when a ticket is marked resolved, and view CSAT trends on the admin dashboard.', category: 'Feature Request', priority: 'MEDIUM' as TicketPriority, sentiment: 'Positive' as TicketSentiment },
  { subject: 'Refund processed for wrong amount', description: 'Our agreed credit adjustment was $500.00, but only $50.00 was credited to our card. Please correct the remaining $450.00 balance.', category: 'Billing', priority: 'HIGH' as TicketPriority, sentiment: 'Negative' as TicketSentiment },
  { subject: 'Emergency: API returning 500 for all requests', description: 'Every API endpoint is returning 500 errors. Our production app is completely offline. Immediate escalation required!', category: 'Technical Issue', priority: 'CRITICAL' as TicketPriority, sentiment: 'Negative' as TicketSentiment },
  { subject: 'Unsubscribed from plan but still being charged', description: 'I cancelled my starter plan on Feb 10th and received cancellation confirmation, but I was still charged $49 on March 1st.', category: 'Billing', priority: 'HIGH' as TicketPriority, sentiment: 'Negative' as TicketSentiment },
  { subject: 'Feature request: Agent performance dashboard with CSAT', description: 'Provide an agent dashboard showing assigned tickets, resolution rate, SLA compliance %, and customer satisfaction scores.', category: 'Feature Request', priority: 'MEDIUM' as TicketPriority, sentiment: 'Positive' as TicketSentiment },
  { subject: 'Excellent support from engineering team!', description: 'The support team monitored our data migration over the weekend and ensured everything went off without a hitch. 10/10!', category: 'Other', priority: 'LOW' as TicketPriority, sentiment: 'Positive' as TicketSentiment },
  { subject: 'Payment gateway returning 502 Bad Gateway during checkout', description: 'Checkout flow crashes on step 3 with 502 Bad Gateway: Upstream payment service unreachable. Customers cannot complete purchases.', category: 'Payment', priority: 'CRITICAL' as TicketPriority, sentiment: 'Negative' as TicketSentiment },
  { subject: 'Unauthorized API key generated from suspicious IP', description: 'An API key named Backup Sync was generated from an unrecognized IP address in Nigeria. We have revoked the key and need an audit.', category: 'Security', priority: 'CRITICAL' as TicketPriority, sentiment: 'Negative' as TicketSentiment },
  { subject: 'Cannot invite members with + in email address', description: 'When inviting a team member with email formatted as dev+test@company.com, the validation modal says Invalid email address format.', category: 'Account', priority: 'LOW' as TicketPriority, sentiment: 'Negative' as TicketSentiment },
  { subject: 'How do I invite teammates to my workspace?', description: 'I recently upgraded to the Pro plan and want to invite 3 additional team members. Where in the settings do I send team invitations?', category: 'Account', priority: 'LOW' as TicketPriority, sentiment: 'Neutral' as TicketSentiment },
  { subject: 'Mobile push notifications not arriving on Android 14', description: 'Since updating to Android 14, agent push notifications for new incoming tickets are not being delivered unless the app is open in foreground.', category: 'Product Issue', priority: 'MEDIUM' as TicketPriority, sentiment: 'Negative' as TicketSentiment },
  { subject: 'Request for SOC2 Type II compliance report', description: 'Can you provide your latest SOC2 Type II report and third-party penetration testing summary for our enterprise vendor assessment?', category: 'Security', priority: 'MEDIUM' as TicketPriority, sentiment: 'Neutral' as TicketSentiment },
  { subject: 'Notification emails marked as SPAM by Google Workspace', description: 'All automated email notifications from our platform are failing SPF and DKIM validation and ending up in customer spam folders.', category: 'Technical Issue', priority: 'HIGH' as TicketPriority, sentiment: 'Negative' as TicketSentiment },
  { subject: 'Feature request: Canned response templates for agents', description: 'Support agents need keyboard shortcuts like /macros to quickly insert standardized greeting and troubleshooting templates.', category: 'Feature Request', priority: 'MEDIUM' as TicketPriority, sentiment: 'Positive' as TicketSentiment },
  { subject: 'Credit card charged three times for monthly renewal', description: 'Our bank statement reflects three distinct charges on the same date for a single monthly subscription renewal. Please credit back.', category: 'Billing', priority: 'HIGH' as TicketPriority, sentiment: 'Negative' as TicketSentiment },
  { subject: 'Cross-tenant data leakage in search results', description: 'Searching for customer names in global search displayed tickets from other tenant companies! Immediate security lockdown needed.', category: 'Security', priority: 'CRITICAL' as TicketPriority, sentiment: 'Negative' as TicketSentiment },
  { subject: 'SLA breached on Critical ticket: No response for 8 hours', description: 'Our critical production outage ticket has been open for 8 hours without response, violating our 2-hour Enterprise SLA commitment.', category: 'Complaint', priority: 'CRITICAL' as TicketPriority, sentiment: 'Negative' as TicketSentiment },
  { subject: 'Feature request: Automated ticket routing by specialization', description: 'Route incoming tickets automatically to the best available agent based on category specialization and current active workload.', category: 'Feature Request', priority: 'MEDIUM' as TicketPriority, sentiment: 'Positive' as TicketSentiment }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('[*] Connected to MongoDB...');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      SLA.deleteMany({}),
      Ticket.deleteMany({}),
      Message.deleteMany({}),
      Feedback.deleteMany({}),
      Notification.deleteMany({})
    ]);
    console.log('[*] Existing data cleared.');

    const salt = await bcrypt.genSalt(10);

    // ── 1. Create Admin ──────────────────────────────────────────────────────
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@supportiq.com',
      password: await bcrypt.hash('admin123', salt),
      role: 'ADMIN',
      skills: ['System Administration', 'All Categories'],
      availability: 'AVAILABLE',
      company: 'SupportIQ'
    });
    console.log('[✓] Admin created:', admin.email);

    // ── 2. Create Support Agents ─────────────────────────────────────────────
    const agentData = [
      { name: 'Sarah Mitchell', email: 'sarah@supportiq.com', skills: ['Technical Support', 'Technical Issue', 'Product Issue'] },
      { name: 'David Chen', email: 'david@supportiq.com', skills: ['Cybersecurity & Identity', 'Security', 'Login', 'Account'] },
      { name: 'Emily Rodriguez', email: 'emily@supportiq.com', skills: ['Billing & Accounts', 'Billing', 'Payment'] },
      { name: 'James Wilson', email: 'james@supportiq.com', skills: ['Customer Success & Escalations', 'Complaint', 'Feature Request', 'Other'] },
      { name: 'Priya Sharma', email: 'priya@supportiq.com', skills: ['Identity & Access', 'Account', 'Login', 'Security'] }
    ];

    const agents = await Promise.all(
      agentData.map((agent) =>
        User.create({
          ...agent,
          password: bcrypt.hashSync('agent123', 10),
          role: 'AGENT',
          availability: 'AVAILABLE',
          company: 'SupportIQ'
        })
      )
    );
    console.log(`[✓] ${agents.length} Agents created.`);

    // ── 3. Create Customers ──────────────────────────────────────────────────
    const customerData = [
      { name: 'Alice Johnson', email: 'alice@techcorp.com', company: 'TechCorp Solutions' },
      { name: 'Bob Martinez', email: 'bob@globalretail.com', company: 'Global Retail Inc.' },
      { name: 'Carol Williams', email: 'carol@financeplus.com', company: 'FinancePlus Ltd.' },
      { name: 'Daniel Lee', email: 'daniel@startupxyz.com', company: 'StartupXYZ' },
      { name: 'Eva Brown', email: 'eva@healthtech.com', company: 'HealthTech Dynamics' },
      { name: 'Frank Davis', email: 'frank@mediacorp.com', company: 'MediaCorp International' },
      { name: 'Grace Kim', email: 'grace@ecommercestore.com', company: 'eCommerce Store' },
      { name: 'Henry Thompson', email: 'henry@legalfirm.com', company: 'Thompson Legal Advisors' },
      { name: 'Isabelle Moore', email: 'isabelle@designstudio.com', company: 'Creative Design Studio' },
      { name: 'Jack Taylor', email: 'jack@cloudservices.com', company: 'Cloud Services Pro' }
    ];

    const customers = await Promise.all(
      customerData.map((customer) =>
        User.create({
          ...customer,
          password: bcrypt.hashSync('customer123', 10),
          role: 'CUSTOMER',
          availability: 'AVAILABLE',
          skills: []
        })
      )
    );
    console.log(`[✓] ${customers.length} Customers created.`);

    // ── 4. Create SLA Rules ──────────────────────────────────────────────────
    await SLA.insertMany([
      { priority: 'CRITICAL', resolutionHours: 2, responseHours: 0.5, description: 'Critical issues must be resolved within 2 hours', isActive: true },
      { priority: 'HIGH', resolutionHours: 4, responseHours: 1, description: 'High priority issues must be resolved within 4 hours', isActive: true },
      { priority: 'MEDIUM', resolutionHours: 12, responseHours: 2, description: 'Medium priority issues must be resolved within 12 hours', isActive: true },
      { priority: 'LOW', resolutionHours: 24, responseHours: 4, description: 'Low priority issues must be resolved within 24 hours', isActive: true }
    ]);
    console.log('[✓] SLA rules created.');

    // ── 5. Create Categories ─────────────────────────────────────────────────
    await Category.insertMany([
      { name: 'Technical Issue', description: 'API errors, server outages, performance issues', defaultPriority: 'HIGH', slaHours: 4, icon: 'Server', isActive: true },
      { name: 'Security', description: 'Security vulnerabilities, unauthorized access, breaches', defaultPriority: 'CRITICAL', slaHours: 2, icon: 'Shield', isActive: true },
      { name: 'Billing', description: 'Invoice issues, refunds, subscription questions', defaultPriority: 'MEDIUM', slaHours: 12, icon: 'CreditCard', isActive: true },
      { name: 'Payment', description: 'Payment failures, gateway issues, transaction problems', defaultPriority: 'HIGH', slaHours: 4, icon: 'DollarSign', isActive: true },
      { name: 'Login', description: 'Login failures, password resets, SSO issues', defaultPriority: 'HIGH', slaHours: 4, icon: 'Lock', isActive: true },
      { name: 'Account', description: 'Account management, user permissions, workspace settings', defaultPriority: 'MEDIUM', slaHours: 12, icon: 'User', isActive: true },
      { name: 'Product Issue', description: 'UI bugs, feature malfunctions, mobile app issues', defaultPriority: 'MEDIUM', slaHours: 12, icon: 'Bug', isActive: true },
      { name: 'Feature Request', description: 'New feature suggestions and enhancement requests', defaultPriority: 'LOW', slaHours: 24, icon: 'Lightbulb', isActive: true },
      { name: 'Complaint', description: 'Customer complaints and escalation requests', defaultPriority: 'HIGH', slaHours: 4, icon: 'AlertCircle', isActive: true },
      { name: 'Other', description: 'General inquiries and miscellaneous requests', defaultPriority: 'LOW', slaHours: 24, icon: 'HelpCircle', isActive: true }
    ]);
    console.log('[✓] Categories created.');

    // SLA deadline helper
    const slaDeadlineMap: Record<string, number> = { CRITICAL: 2, HIGH: 4, MEDIUM: 12, LOW: 24 };

    const computeDeadline = (priority: string, hoursAgo: number) => {
      const created = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
      return new Date(created.getTime() + slaDeadlineMap[priority] * 60 * 60 * 1000);
    };

    // ── 6. Create Tickets ────────────────────────────────────────────────────
    const statuses: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'RESOLVED', 'CLOSED', 'OPEN', 'IN_PROGRESS', 'RESOLVED'];

    const createdTickets = [];
    for (let i = 0; i < sampleTicketData.length; i++) {
      const tData = sampleTicketData[i];
      const customer = customers[i % customers.length];
      const agentIndex = i % agents.length;
      const agent = agents[agentIndex];
      const status = statuses[i % statuses.length];
      const hoursAgo = Math.floor(Math.random() * 48) + 1;

      const createdAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
      const slaDeadline = new Date(createdAt.getTime() + slaDeadlineMap[tData.priority] * 60 * 60 * 1000);

      const resolvedAt =
        status === 'RESOLVED' || status === 'CLOSED'
          ? new Date(createdAt.getTime() + Math.random() * slaDeadlineMap[tData.priority] * 60 * 60 * 1000 * 0.8)
          : undefined;

      const isBreached = slaDeadline < new Date() && status !== 'RESOLVED' && status !== 'CLOSED';
      const slaStatus = status === 'RESOLVED' || status === 'CLOSED'
        ? 'COMPLETED'
        : isBreached
        ? 'BREACHED'
        : 'ON_TRACK';

      const ticket = await Ticket.create({
        ticketNumber: `TCK-${1001 + i}`,
        customer: customer._id,
        assignedAgent: agent._id,
        subject: tData.subject,
        description: tData.description,
        category: tData.category,
        priority: tData.priority,
        status,
        sentiment: tData.sentiment,
        confidence: Number((0.78 + Math.random() * 0.19).toFixed(2)),
        slaDeadline,
        slaStatus,
        tags: [],
        internalNotes: [],
        resolvedAt,
        createdAt,
        updatedAt: createdAt
      });

      createdTickets.push(ticket);
    }
    console.log(`[✓] ${createdTickets.length} Tickets created.`);

    // ── 7. Create Sample Messages ────────────────────────────────────────────
    const agentReplies = [
      'Thank you for reaching out. I am actively investigating this issue and will provide an update shortly.',
      'I have reproduced the issue on our test environment. Working on a fix now.',
      'This has been escalated to our senior engineering team. ETA for resolution is 2 hours.',
      'Issue confirmed. A patch has been deployed. Please clear your cache and test again.',
      'I have reviewed your account and the issue appears to be resolved. Please confirm on your end.'
    ];

    const customerReplies = [
      'Thank you for the update! We are still experiencing the issue. Any further update?',
      'The issue persists after the patch. Can we schedule a call?',
      'Confirmed! The issue is now resolved. Thank you for the quick response!',
      'Still seeing errors. Attached a screenshot for your reference.',
      'The fix worked perfectly. Thank you for the excellent support!'
    ];

    for (let i = 0; i < Math.min(30, createdTickets.length); i++) {
      const ticket = createdTickets[i];
      const customer = await User.findById(ticket.customer);
      const agent = await User.findById(ticket.assignedAgent);

      // Agent message
      await Message.create({
        ticket: ticket._id,
        sender: agent?._id || agents[0]._id,
        message: agentReplies[i % agentReplies.length],
        isInternal: false,
        createdAt: new Date(ticket.createdAt.getTime() + 30 * 60 * 1000)
      });

      // Customer reply for some tickets
      if (i % 2 === 0) {
        await Message.create({
          ticket: ticket._id,
          sender: customer?._id || customers[0]._id,
          message: customerReplies[i % customerReplies.length],
          isInternal: false,
          createdAt: new Date(ticket.createdAt.getTime() + 90 * 60 * 1000)
        });
      }
    }
    console.log('[✓] Messages created.');

    // ── 8. Create Feedback ───────────────────────────────────────────────────
    const resolvedTickets = createdTickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED');
    const ratings = [5, 4, 5, 3, 5, 4, 4, 5, 5, 4, 3, 5, 5, 4, 2];
    const comments = [
      'Exceptional service! Issue resolved faster than expected.',
      'Very helpful agent. Clear and concise communication.',
      'Problem solved perfectly. Thanks for the quick response!',
      'Average experience. The issue took longer than expected.',
      'Absolutely outstanding support. Will definitely recommend.',
      'Good support overall. Could have been slightly faster.',
      'Agent was very professional and knowledgeable.',
      'Incredible response time! Everything works now.',
      'Perfect resolution! The agent went above and beyond.',
      'Satisfied with the resolution. Thank you.',
      'The issue took a while but was eventually resolved.',
      'Best support experience I have had. 5 stars!',
      'Quick and accurate diagnosis. Great work!',
      'Friendly and effective support team.',
      'Took a bit long but the issue is fixed now.'
    ];

    for (let i = 0; i < Math.min(resolvedTickets.length, ratings.length); i++) {
      const ticket = resolvedTickets[i];
      await Feedback.create({
        ticket: ticket._id,
        customer: ticket.customer,
        rating: ratings[i],
        comment: comments[i % comments.length]
      });
    }
    console.log('[✓] Feedback created.');

    // ── 9. Create Notifications ──────────────────────────────────────────────
    for (let i = 0; i < 10; i++) {
      const ticket = createdTickets[i];
      const agent = agents[i % agents.length];
      await Notification.create({
        recipient: agent._id,
        title: `New Ticket Assigned: ${ticket.ticketNumber}`,
        message: `Priority ${ticket.priority} ticket "${ticket.subject.substring(0, 50)}..." has been assigned to you.`,
        type: 'TICKET_ASSIGNED',
        ticketId: ticket._id,
        read: i > 4
      });
    }

    for (const customer of customers.slice(0, 5)) {
      await Notification.create({
        recipient: customer._id,
        title: 'Your ticket has been updated',
        message: 'An agent has responded to your support ticket.',
        type: 'NEW_REPLY',
        read: false
      });
    }
    console.log('[✓] Notifications created.');

    console.log('');
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║    SupportIQ Seed Data — Complete!           ║');
    console.log('╠══════════════════════════════════════════════╣');
    console.log('║  Admin:    admin@supportiq.com / admin123    ║');
    console.log('║  Agent:    sarah@supportiq.com / agent123    ║');
    console.log('║  Agent:    david@supportiq.com / agent123    ║');
    console.log('║  Customer: alice@techcorp.com / customer123  ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log('');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[✗] Seed error:', error);
    process.exit(1);
  }
}

seed();

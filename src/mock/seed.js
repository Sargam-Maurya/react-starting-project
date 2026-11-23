/**
 * Deterministic seed generator for fictional demo data.
 * Seeded PRNG keeps generated data stable; timestamps are relative
 * to the moment the database is first seeded (then persisted).
 */

export const BRANCHES = [
  "Mumbai Central",
  "Pune West",
  "Delhi North",
  "Chennai South",
  "Bengaluru East",
  "Hyderabad",
];

const AGENT_NAMES = [
  "Rahul Sharma", "Sneha Patil", "Vikram Singh", "Anita Desai", "Rohit Kumar",
  "Meena Iyer", "Arjun Nair", "Kavita Joshi", "Suresh Reddy", "Pooja Mehta",
  "Nitin Gupta", "Divya Menon", "Manoj Yadav", "Shreya Kulkarni", "Tarun Bhat",
  "Rekha Pillai", "Amit Verma", "Lakshmi Rao", "Karan Malhotra", "Nisha Agarwal",
];

const CUSTOMER_NAMES = [
  "Ramesh Chandra", "Sunita Devi", "Prakash Jadhav", "Farida Khan", "Gopal Krishnan",
  "Anjali Bhosale", "Deepak Chawla", "Radha Nambiar", "Santosh Pawar", "Indira Reddy",
  "Mohammed Irfan", "Geeta Sharma", "Rajesh Kulkarni", "Savita More", "Harish Naidu",
  "Uma Shankar", "Balaji Venkat", "Chandini Kapoor", "Dinesh Thakur", "Esha Rani",
  "Firoz Ahmed", "Gayatri Hegde", "Hemant Solanki", "Isha Qureshi", "Jagdish Prasad",
  "Kamala Devi", "Lalit Mohan", "Madhuri Dixit", "Naveen Chandra", "Omkar Sawant",
  "Padma Lakshmi", "Qasim Ali", "Ritu Malhotra", "Shankar Iyer", "Tanvi Deshpande",
  "Uday Bhosale", "Vandana Kaur", "Wasim Sheikh", "Yashoda Bai", "Zubin Irani",
  "Ashok Rane", "Bhavna Trivedi", "Chirag Patel", "Darshan Gowda", "Ekta Kapoor",
  "Farhan Sheikh", "Gauri Shinde", "Harsha Vardhan", "Irfan Pathan", "Jyoti Swami",
];

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20240117);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const randInt = (min, max) => Math.floor(rand() * (max - min + 1)) + min;

const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(n, hour = randInt(9, 18)) {
  const d = new Date(Date.now() - n * DAY_MS);
  d.setHours(hour, randInt(0, 59), 0, 0);
  return d.toISOString();
}

function generateAgents() {
  return AGENT_NAMES.map((name, i) => ({
    id: `AGT-${String(i + 1).padStart(3, "0")}`,
    name,
    branch: BRANCHES[i % BRANCHES.length],
    phone: `+91 98${randInt(10000000, 99999999)}`,
    monthlyTarget: randInt(20, 50) * 10000,
    status: rand() < 0.9 ? "Active" : "Inactive",
    joinedDate: daysAgo(randInt(180, 900)).slice(0, 10),
  }));
}

function generateCustomers(agents) {
  const activeAgents = agents.filter((a) => a.status === "Active");

  return CUSTOMER_NAMES.map((name, i) => {
    const loanAmount = randInt(5, 50) * 10000;
    const tenureMonths = randInt(12, 36);
    const emiAmount = Math.ceil(loanAmount / tenureMonths / 100) * 100;
    const repaidRatio = rand() * 0.7;
    const outstandingAmount = Math.round(loanAmount * (1 - repaidRatio) / 100) * 100;
    const overdueDays = rand() < 0.35 ? randInt(3, 90) : 0;

    const due = new Date();
    due.setDate(due.getDate() + randInt(-10, 25));

    const agent = activeAgents[i % activeAgents.length];

    return {
      id: `CUS-${String(i + 1).padStart(3, "0")}`,
      name,
      phone: `+91 97${randInt(10000000, 99999999)}`,
      loanAccountNumber: `LN${randInt(100000000, 999999999)}`,
      loanAmount,
      emiAmount,
      dueDate: due.toISOString().slice(0, 10),
      outstandingAmount,
      overdueDays,
      agentId: agent.id,
      branch: agent.branch,
      status: overdueDays > 0 ? "Overdue" : "Active",
    };
  });
}

function generateCollections(agents, customers) {
  const collections = [];
  const activeAgents = agents.filter((a) => a.status === "Active");
  let counter = 1;

  for (let day = 45; day >= 0; day--) {
    const txnsToday = day === 0 ? randInt(4, 8) : randInt(2, 7);

    for (let t = 0; t < txnsToday; t++) {
      const customer = pick(customers);
      const agent = rand() < 0.8
        ? agents.find((a) => a.id === customer.agentId)
        : pick(activeAgents);

      const modeRoll = rand();
      const mode = modeRoll < 0.6 ? "Cash" : modeRoll < 0.85 ? "UPI" : "Bank Transfer";
      const amount = Math.max(500, Math.round(customer.emiAmount * (0.5 + rand()) / 100) * 100);

      collections.push({
        id: `TXN-${String(counter++).padStart(5, "0")}`,
        customerId: customer.id,
        customerName: customer.name,
        loanAccountNumber: customer.loanAccountNumber,
        agentId: agent.id,
        agentName: agent.name,
        branch: agent.branch,
        amount,
        paymentDate: daysAgo(day),
        mode,
        referenceNumber: `RCP${String(randInt(100000, 999999))}`,
        status: "Completed",
      });
    }
  }

  return collections;
}

function generateDeposits(agents, collections) {
  const deposits = [];
  const cashByAgent = {};

  for (const c of collections) {
    if (c.mode === "Cash") {
      cashByAgent[c.agentId] = (cashByAgent[c.agentId] || 0) + c.amount;
    }
  }

  const agentsWithCash = Object.entries(cashByAgent)
    .map(([agentId, cash]) => ({ agent: agents.find((a) => a.id === agentId), cash }))
    .filter((x) => x.agent);

  let counter = 1;
  for (const { agent, cash } of agentsWithCash) {
    let approvedTotal = 0;
    const numDeposits = randInt(1, 3);
    for (let d = 0; d < numDeposits; d++) {
      const roll = rand();
      const status = roll < 0.6 ? "Approved" : roll < 0.85 ? "Pending" : "Rejected";

      // Verified deposits must never exceed cash collected — leave ~15% in hand
      let amount = randInt(30, 90) * 1000;
      if (status === "Approved") {
        const cap = Math.round(cash * 0.85) - approvedTotal;
        if (cap < 10000) continue;
        amount = Math.min(cap, amount);
        approvedTotal += amount;
      }

      deposits.push({
        id: `DEP-${String(counter++).padStart(4, "0")}`,
        referenceNumber: `UTR${String(randInt(1000000000, 9999999999))}`,
        agentId: agent.id,
        agentName: agent.name,
        branch: agent.branch, 
        amount,
        depositDate: daysAgo(randInt(0, 30)),
        status,
        submittedBy: agent.name,
        verifiedBy: status === "Approved" ? "Priya Nair" : null,
        rejectionReason: status === "Rejected" ? pick([
          "Amount mismatch with collection records",
          "Duplicate reference number",
          "Missing deposit slip",
        ]) : null,
        createdAt: daysAgo(randInt(0, 30)),
      });
    }
  }

  return deposits;
}

function generateAuditLogs(collections, deposits) {
  const logs = [];
  let counter = 1;

  for (const c of collections.slice(0, 12)) {
    logs.push({
      id: `LOG-${String(counter++).padStart(4, "0")}`,
      timestamp: c.paymentDate,
      user: c.agentName,
      action: "Collection Recorded",
      referenceId: c.id,
      details: `${c.mode} payment of ₹${c.amount.toLocaleString("en-IN")} from ${c.customerName}`,
    });
  }

  for (const d of deposits) {
    logs.push({
      id: `LOG-${String(counter++).padStart(4, "0")}`,
      timestamp: d.createdAt,
      user: d.submittedBy,
      action: "Deposit Submitted",
      referenceId: d.id,
      details: `Deposit of ₹${d.amount.toLocaleString("en-IN")} (Ref: ${d.referenceNumber})`,
    });
    if (d.status === "Approved") {
      logs.push({
        id: `LOG-${String(counter++).padStart(4, "0")}`,
        timestamp: d.depositDate,
        user: d.verifiedBy,
        action: "Deposit Approved",
        referenceId: d.id,
        details: `Verified deposit ${d.referenceNumber}`,
      });
    } else if (d.status === "Rejected") {
      logs.push({
        id: `LOG-${String(counter++).padStart(4, "0")}`,
        timestamp: d.depositDate,
        user: "Priya Nair",
        action: "Deposit Rejected",
        referenceId: d.id,
        details: d.rejectionReason,
      });
    }
  }

  return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export function generateSeedData() {
  const agents = generateAgents();
  const customers = generateCustomers(agents);
  const collections = generateCollections(agents, customers);
  const deposits = generateDeposits(agents, collections);
  const auditLogs = generateAuditLogs(collections, deposits);

  return { branches: BRANCHES, agents, customers, collections, deposits, auditLogs };
}

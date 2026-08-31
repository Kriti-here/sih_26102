import type { WorkRow, UnitOfMeasure, WorkStatus } from "./types";

// Deterministic PRNG so the dataset is reproducible across runs/seeds.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260131);
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}
function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}
function chance(p: number): boolean {
  return rand() < p;
}
function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const TODAY = "2026-08-26";

const STATES: { state: string; districts: string[]; mps: { name: string; constituency: string }[] }[] = [
  {
    state: "Maharashtra",
    districts: ["Pune", "Nagpur", "Nashik", "Aurangabad", "Thane"],
    mps: [
      { name: "Rajesh Deshmukh", constituency: "Pune" },
      { name: "Sunita Patil", constituency: "Nagpur" },
      { name: "Anil Joshi", constituency: "Nashik" },
    ],
  },
  {
    state: "Uttar Pradesh",
    districts: ["Lucknow", "Kanpur", "Varanasi", "Agra", "Meerut", "Gorakhpur"],
    mps: [
      { name: "Mahesh Yadav", constituency: "Lucknow" },
      { name: "Kavita Sharma", constituency: "Varanasi" },
      { name: "Dinesh Verma", constituency: "Agra" },
      { name: "Ramesh Gupta", constituency: "Gorakhpur" },
    ],
  },
  {
    state: "Tamil Nadu",
    districts: ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
    mps: [
      { name: "Lakshmi Iyer", constituency: "Chennai" },
      { name: "Karthik Subramaniam", constituency: "Madurai" },
      { name: "Priya Nair", constituency: "Coimbatore" },
    ],
  },
  {
    state: "Karnataka",
    districts: ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi", "Belagavi"],
    mps: [
      { name: "Vijay Kumar", constituency: "Bengaluru" },
      { name: "Deepa Rao", constituency: "Mysuru" },
      { name: "Suresh Gowda", constituency: "Hubballi" },
    ],
  },
  {
    state: "West Bengal",
    districts: ["Kolkata", "Howrah", "Darjeeling", "Asansol", "Siliguri"],
    mps: [
      { name: "Abhijit Banerjee", constituency: "Kolkata" },
      { name: "Mamata Das", constituency: "Asansol" },
      { name: "Subhash Dutta", constituency: "Siliguri" },
    ],
  },
  {
    state: "Gujarat",
    districts: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar"],
    mps: [
      { name: "Hardik Patel", constituency: "Ahmedabad" },
      { name: "Meera Shah", constituency: "Surat" },
      { name: "Nilesh Joshi", constituency: "Rajkot" },
    ],
  },
  {
    state: "Rajasthan",
    districts: ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner"],
    mps: [
      { name: "Arjun Singh", constituency: "Jaipur" },
      { name: "Pooja Rathore", constituency: "Jodhpur" },
      { name: "Gajendra Choudhary", constituency: "Kota" },
    ],
  },
  {
    state: "Bihar",
    districts: ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga"],
    mps: [
      { name: "Santosh Kumar", constituency: "Patna" },
      { name: "Reena Devi", constituency: "Gaya" },
      { name: "Alok Ranjan", constituency: "Muzaffarpur" },
    ],
  },
  {
    state: "Kerala",
    districts: ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam"],
    mps: [
      { name: "Thomas Kurian", constituency: "Thiruvananthapuram" },
      { name: "Anand Menon", constituency: "Kochi" },
      { name: "Sheeja Pillai", constituency: "Kozhikode" },
    ],
  },
  {
    state: "Telangana",
    districts: ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam"],
    mps: [
      { name: "K. Reddy", constituency: "Hyderabad" },
      { name: "Saritha Reddy", constituency: "Warangal" },
      { name: "Naveen Rao", constituency: "Nizamabad" },
    ],
  },
  {
    state: "Andhra Pradesh",
    districts: ["Visakhapatnam", "Vijayawada", "Guntur", "Tirupati", "Kurnool"],
    mps: [
      { name: "Venkatesh Naidu", constituency: "Visakhapatnam" },
      { name: "Lakshmi Prasad", constituency: "Vijayawada" },
      { name: "Ravi Babu", constituency: "Guntur" },
    ],
  },
  {
    state: "Madhya Pradesh",
    districts: ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain"],
    mps: [
      { name: "Om Prakash", constituency: "Bhopal" },
      { name: "Neelam Singh", constituency: "Indore" },
      { name: "Yashwant Tomar", constituency: "Gwalior" },
    ],
  },
  {
    state: "Punjab",
    districts: ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda"],
    mps: [
      { name: "Harpreet Singh", constituency: "Ludhiana" },
      { name: "Simran Kaur", constituency: "Amritsar" },
      { name: "Gurpreet Brar", constituency: "Patiala" },
    ],
  },
  {
    state: "Odisha",
    districts: ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur"],
    mps: [
      { name: "Bibhuti Mohanty", constituency: "Bhubaneswar" },
      { name: "Sushma Patnaik", constituency: "Cuttack" },
      { name: "Debasis Behera", constituency: "Rourkela" },
    ],
  },
  {
    state: "Assam",
    districts: ["Guwahati", "Dibrugarh", "Silchar", "Jorhat", "Tezpur"],
    mps: [
      { name: "Bhola Saikia", constituency: "Guwahati" },
      { name: "Rina Borah", constituency: "Dibrugarh" },
      { name: "Anup Hazarika", constituency: "Silchar" },
    ],
  },
  {
    state: "Jharkhand",
    districts: ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Hazaribag"],
    mps: [
      { name: "Manoj Tiwary", constituency: "Ranchi" },
      { name: "Kalpana Soren", constituency: "Dhanbad" },
      { name: "Hemant Munda", constituency: "Jamshedpur" },
    ],
  },
];

const CONTRACTORS = [
  "Shree Balaji Infra Pvt Ltd",
  "Mahalaxmi Construction Co.",
  "Vidarbha Builders & Sons",
  "Shree Ganesh Civil Works",
  "Krishna Engineering Projects",
  "Sai Ram Infra Solutions",
  "Anjani Contractors LLP",
  "Bharat Infrastructure Group",
  "Jay Hanuman Civil Tech",
  "Saraswati Builders Pvt Ltd",
  "Durga Construction Agency",
  "Om Sai Road Works",
  "Trimurti Civil Engineers",
  "Shakti Infra Developers",
  "Shree Siddhivinayak Contractors",
  "Maa Kali Construction Ltd",
  "Shree Ram Projects India",
  "Ganpati Infra Ventures",
];

const CATEGORIES: {
  category: string;
  unit: UnitOfMeasure;
  baseCostPerUnit: number; // typical ₹ per unit
  baseQty: [number, number]; // min,max quantity
  labelWords: string[];
}[] = [
  { category: "Community Hall", unit: "sqft", baseCostPerUnit: 1800, baseQty: [2000, 8000], labelWords: ["Community", "Hall", "Bhavan", "Sabha"] },
  { category: "Drainage", unit: "meter", baseCostPerUnit: 4500, baseQty: [300, 2000], labelWords: ["Drainage", "Nala", "Storm Water Drain"] },
  { category: "Road Construction", unit: "meter", baseCostPerUnit: 8500, baseQty: [200, 1500], labelWords: ["Road", "CC Road", "Internal Road"] },
  { category: "Playground", unit: "sqft", baseCostPerUnit: 350, baseQty: [5000, 25000], labelWords: ["Playground", "Sports Ground", "Play Area"] },
  { category: "School Building", unit: "sqft", baseCostPerUnit: 1600, baseQty: [3000, 12000], labelWords: ["School", "Classroom", "School Building"] },
  { category: "Street Lights", unit: "unit", baseCostPerUnit: 28000, baseQty: [20, 150], labelWords: ["Street Light", "Solar Light", "LED Street Lighting"] },
  { category: "Health Sub-Centre", unit: "sqft", baseCostPerUnit: 2100, baseQty: [1500, 4000], labelWords: ["Health Sub-Centre", "PHC", "Health Centre"] },
  { category: "Drinking Water", unit: "unit", baseCostPerUnit: 180000, baseQty: [5, 40], labelWords: ["Drinking Water", "RO Plant", "Water ATMS"] },
];

const TITLE_PLACES = ["Sector 12", "Ward 7", "Village Rampur", "Colony", "Old Town", "Ring Road", "Main Bazaar", "Industrial Area", "Tehsil HQ", "Block Office"];

let workCounter = 10001;

function makeTitle(cat: string, catMeta: (typeof CATEGORIES)[number]): string {
  const word = pick(catMeta.labelWords);
  const place = pick(TITLE_PLACES);
  const phase = chance(0.12) ? ` Phase ${randInt(1, 3)}` : "";
  return `${word} at ${place}${phase}`;
}

export function generateSeedWorks(): WorkRow[] {
  const works: WorkRow[] = [];
  const N = 285;

  for (let i = 0; i < N; i++) {
    const st = pick(STATES);
    const district = pick(st.districts);
    const mp = pick(st.mps);
    const contractor = pick(CONTRACTORS);
    const catMeta = pick(CATEGORIES);
    const cat = catMeta.category;
    const unit = catMeta.unit;

    const qty = randInt(catMeta.baseQty[0], catMeta.baseQty[1]);

    // Normal cost/unit with small noise; anomalies injected below
    let costPerUnit = catMeta.baseCostPerUnit * (0.8 + rand() * 0.5);
    // ~6% of works get an extreme cost/unit outlier
    if (chance(0.06)) costPerUnit *= 4 + rand() * 6;

    const sanctionedAmount = Math.round(costPerUnit * qty);

    const sanctionYear = pick([2021, 2022, 2023, 2024, 2025]);
    const sanctionDate = isoDate(sanctionYear, randInt(1, 12), randInt(1, 28));
    const expectedCompletionDate = addDays(sanctionDate, randInt(120, 420));

    // progress & status
    let progressPercent = randInt(0, 100);
    let status: WorkStatus;
    if (progressPercent >= 100) {
      status = chance(0.85) ? "Completed" : "In Progress";
    } else if (progressPercent >= 15) {
      status = "In Progress";
    } else if (chance(0.2)) {
      status = chance(0.5) ? "Sanctioned" : "Recommended";
    } else {
      status = "In Progress";
    }

    // Delayed / Stalled injection
    if (chance(0.1) && status !== "Completed") {
      // past expected completion date
      if (new Date(expectedCompletionDate) < new Date(TODAY)) {
        status = "Delayed";
        progressPercent = Math.min(progressPercent, randInt(20, 80));
      }
    }
    if (chance(0.05)) {
      status = "Stalled";
      progressPercent = randInt(0, 8);
    }

    let actualCompletionDate: string | null = null;
    if (status === "Completed") {
      actualCompletionDate = addDays(sanctionDate, randInt(90, 380));
      progressPercent = 100;
    }

    // expenditure
    let expenditureToDate: number;
    if (status === "Recommended") {
      expenditureToDate = 0;
    } else if (status === "Sanctioned") {
      expenditureToDate = Math.round(sanctionedAmount * (0.0 + rand() * 0.1));
    } else if (status === "Stalled") {
      expenditureToDate = Math.round(sanctionedAmount * (0.2 + rand() * 0.3));
    } else if (status === "Completed") {
      // ~10% cost overrun on completed
      expenditureToDate = chance(0.1)
        ? Math.round(sanctionedAmount * (1.16 + rand() * 0.25))
        : Math.round(sanctionedAmount * (0.9 + rand() * 0.12));
    } else {
      // In Progress / Delayed
      const progFraction = progressPercent / 100;
      expenditureToDate = Math.round(sanctionedAmount * progFraction * (0.7 + rand() * 0.6));
      // payment ahead of progress injection (~8%)
      if (chance(0.08)) {
        expenditureToDate = Math.round(sanctionedAmount * Math.min(1, progFraction + 0.25 + rand() * 0.2));
      }
    }

    // completion photo: ~15% of completed works lack evidence
    const completionPhotoUploaded = status === "Completed" ? chance(0.85) : chance(0.3);

    const workCode = `MPLADS/${mp.constituency.slice(0, 2).toUpperCase()}/${sanctionYear}/${workCounter++}`;

    works.push({
      id: crypto.randomUUID(),
      work_code: workCode,
      title: makeTitle(cat, catMeta),
      category: cat,
      mp_name: mp.name,
      constituency: mp.constituency,
      state: st.state,
      district,
      implementing_agency: contractor,
      sanctioned_amount: sanctionedAmount,
      expenditure_to_date: expenditureToDate,
      unit_of_measure: unit,
      quantity: qty,
      sanction_date: sanctionDate,
      expected_completion_date: expectedCompletionDate,
      actual_completion_date: actualCompletionDate,
      progress_percent: progressPercent,
      status,
      completion_photo_uploaded: completionPhotoUploaded,
      review_state: "pending",
      created_at: new Date().toISOString(),
    });
  }

  // Inject duplicate-suspect pairs: same category + contractor + district + fiscal year, different titles (not Phase N)
  injectDuplicates(works);

  return works;
}

function injectDuplicates(works: WorkRow[]): void {
  // find a few pairs and clone with a different title but same key fields
  const pairs = 6;
  for (let p = 0; p < pairs; p++) {
    const base = works[Math.floor(rand() * works.length)];
    const catMeta = CATEGORIES.find((c) => c.category === base.category)!;
    const clone: WorkRow = {
      ...base,
      id: crypto.randomUUID(),
      work_code: `MPLADS/${base.constituency.slice(0, 2).toUpperCase()}/${base.sanction_date.slice(0, 4)}/${workCounter++}`,
      title: makeTitle(base.category, catMeta),
      sanctioned_amount: Math.round(base.sanctioned_amount * (0.9 + rand() * 0.2)),
      expenditure_to_date: Math.round(base.expenditure_to_date * (0.8 + rand() * 0.4)),
    };
    // ensure title is genuinely different and not a "Phase N" variant
    if (clone.title === base.title) clone.title = `${catMeta.labelWords[0]} Extension at ${pick(TITLE_PLACES)}`;
    works.push(clone);
  }
}

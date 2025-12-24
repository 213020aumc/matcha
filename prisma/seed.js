import prisma from "../src/config/prisma.js";
import { faker } from "@faker-js/faker";

// Helper for random selection
const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

// FIX: Options must match Enum definitions exactly (Case Sensitive)
// Assuming your Schema Enums are uppercase (e.g. OMNIVORE, VEGETARIAN)
const DIET_OPTIONS = [
  "OMNIVORE",
  "VEGETARIAN",
  "VEGAN",
  "KOSHER",
  "HALAL",
  "GLUTEN_FREE",
];

// Text fields don't need strict matching, but good to keep consistent
const BUILD_OPTIONS = ["Slim", "Athletic", "Average", "Curvy", "Large"];
const HAIR_OPTIONS = ["Auburn", "Black", "Blonde", "Brown", "Red"];
const EYE_OPTIONS = ["Blue", "Black", "Green", "Brown", "Hazel"];
const RACE_OPTIONS = [
  "Caucasian",
  "Asian",
  "African American",
  "Hispanic",
  "Mixed",
  "Other",
];
const ORIENTATION_OPTIONS = ["Heterosexual", "Homosexual", "Bisexual", "Other"];

async function main() {
  console.log("🌱 Starting Seeding...");

  // =======================================================
  // 1. PLANS
  // =======================================================
  const plans = [
    {
      code: "BASIC",
      name: "Basic Access",
      price: 0.0,
      billingCycle: "MONTHLY",
    },
    {
      code: "PREMIUM",
      name: "Premium Family",
      price: 29.99,
      billingCycle: "MONTHLY",
    },
  ];

  for (const p of plans) {
    await prisma.plan.upsert({
      where: { code: p.code },
      update: {},
      create: p,
    });
  }
  console.log("✅ Plans seeded");

  // =======================================================
  // 2. TEST USERS
  // =======================================================

  // --- STATE A: Fresh Login (Just Email) ---
  // Use this to test: Login -> Redirect to Onboarding (Mission/Gender screens)
  await prisma.user.upsert({
    where: { email: "new@helix.com" },
    update: {},
    create: {
      email: "new@helix.com",
      // No Role, No Gender, No Terms yet
    },
  });
  console.log("👉 Created Fresh User (No Onboarding): new@helix.com");

  // --- STATE B: Onboarding Done / Profile Pending ---
  // Use this to test: Login -> Redirect to Profile Completion Stage 1
  await prisma.user.upsert({
    where: { email: "onboarded@helix.com" },
    update: {},
    create: {
      email: "onboarded@helix.com",
      // Onboarding Completed
      termsAccepted: true,
      gender: "WOMAN",
      role: "DONOR",
      serviceType: "DONOR_SERVICES",
      interestedIn: null,
      pairingTypes: ["DONOR_BANK"],
      // No Profile Data yet
    },
  });
  console.log(
    "👉 Created Onboarded User (Pending Profile): onboarded@helix.com"
  );

  // --- STATE C: Partially Completed Profile (Stage 2) ---
  await prisma.user.upsert({
    where: { email: "partial@helix.com" },
    update: {},
    create: {
      email: "partial@helix.com",
      // Onboarding
      termsAccepted: true,
      gender: "MAN",
      role: "DONOR",
      serviceType: "DONOR_SERVICES",
      pairingTypes: ["PRIVATE_DONATION_ONLY"],
      // Profile Stage 1 & 2 Done
      profile: {
        create: {
          legalName: "Jessica Partial",
          dob: new Date("1998-05-20"),
          phoneNumber: "+15550001111",
          address: "123 Onboarding Lane, CA",
          babyPhotoUrl: "https://placehold.co/400x400/png?text=Baby",
          currentPhotoUrl: "https://placehold.co/400x400/png?text=Current",
          education: "Bachelors",
          occupation: "Designer",
          nationality: "American",
          diet: "VEGETARIAN",
          height: 165,
          weight: 55,
          bodyBuild: "Slim",
          hairColor: "Auburn",
          eyeColor: "Green",
        },
      },
    },
  });
  console.log("👉 Created Partial User: partial@helix.com");

  // --- STATE D: Fully Complete User ---
  // Use this to test: Dashboard / Swiping
  await prisma.user.upsert({
    where: { email: "complete@helix.com" },
    update: {},
    create: {
      email: "complete@helix.com",
      // Onboarding
      termsAccepted: true,
      gender: "MAN",
      role: "DONOR",
      serviceType: "DONOR_SERVICES",
      pairingTypes: ["PRIVATE_CO_PARENTING"],

      // Full Profile
      profile: {
        create: {
          legalName: "Michael Complete",
          dob: new Date("1990-12-01"),
          phoneNumber: "+15559998888",
          address: "456 Verified Blvd, NY",
          babyPhotoUrl: "https://placehold.co/400x400/png?text=Baby",
          currentPhotoUrl: "https://placehold.co/400x400/png?text=Current",
          education: "PhD Physics",
          occupation: "Researcher",
          nationality: "German",
          diet: "OMNIVORE",
          height: 180,
          weight: 78,
          bodyBuild: "Athletic",
          hairColor: "Brown",
          eyeColor: "Hazel",
          bio: "I want to help families.",
        },
      },
      health: {
        create: {
          isPrivate: true,
          hasDiabetes: false,
          hasHeartCondition: false,
          allergies: true,
          allergiesDetails: "Peanuts",
          cmvStatus: "NEGATIVE",
        },
      },
      genetic: {
        create: {
          carrierConditions: ["MKS1"],
          reportFileUrl: "https://example.com/report.pdf",
        },
      },
      compensation: {
        create: {
          isInterested: true,
          allowBidding: true,
          askingPrice: 5000,
          minAcceptedPrice: 4500,
          buyNowPrice: 8000,
        },
      },
      legal: {
        create: {
          consentAgreed: true,
          anonymityPreference: "IDENTITY_DISCLOSURE",
        },
      },
    },
  });
  console.log("👉 Created Complete User: complete@helix.com");

  console.log("🌱 Seeding Completed.");

  // =======================================================
  // 3. RANDOM POPULATION
  // =======================================================
  const NUM_USERS = 20;
  console.log(`...Generating ${NUM_USERS} random users...`);

  for (let i = 0; i < NUM_USERS; i++) {
    const sex = random(["male", "female"]);
    const firstName = faker.person.firstName(sex);
    const lastName = faker.person.lastName();

    await prisma.user.create({
      data: {
        email: faker.internet.email({ firstName, lastName }),
        role: "DONOR",
        serviceType: "DONOR_SERVICES",

        // STAGE 1 & 2: PROFILE
        profile: {
          create: {
            legalName: `${firstName} ${lastName}`,
            dob: faker.date.birthdate({ min: 21, max: 35, mode: "age" }),
            phoneNumber: faker.phone.number(),
            address: faker.location.streetAddress(),
            nationality: faker.location.country(),
            bio: faker.person.bio(),

            height: faker.number.int({ min: 150, max: 200 }),
            weight: faker.number.int({ min: 50, max: 100 }),
            bodyBuild: random(BUILD_OPTIONS),
            hairColor: random(HAIR_OPTIONS),
            eyeColor: random(EYE_OPTIONS),
            diet: random(DIET_OPTIONS), // Now strictly upper case
            race: random(RACE_OPTIONS),
            orientation: random(ORIENTATION_OPTIONS),

            education: random(["High School", "Bachelor", "Master", "PhD"]),
            occupation: faker.person.jobTitle(),

            babyPhotoUrl: faker.image.url({ height: 400, width: 400 }),
            currentPhotoUrl: faker.image.url({ height: 400, width: 400 }),
          },
        },

        // STAGE 3: HEALTH
        health: {
          create: {
            isPrivate: true,
            hasDiabetes: faker.datatype.boolean(0.1),
            hasHeartCondition: false,
            hasAutoimmune: false,
            allergies: faker.datatype.boolean(),
            allergiesDetails: "Seasonal Pollen",
            cmvStatus: random(["POSITIVE", "NEGATIVE", "NOT_SURE"]), // Uppercase
            mentalHealthHistory: "None",
            hivHepStatus: false,

            menstrualRegularity: sex === "female" ? true : null,
            pregnancyHistory:
              sex === "female" ? faker.datatype.boolean() : null,
          },
        },

        // STAGE 4: GENETIC
        genetic: {
          create: {
            carrierConditions: faker.datatype.boolean() ? ["CFTR", "SMA"] : [],
            reportFileUrl: "https://example.com/dummy-report.pdf",
          },
        },

        // STAGE 5: COMPENSATION
        compensation: {
          create: {
            isInterested: true,
            allowBidding: faker.datatype.boolean(),
            askingPrice: faker.commerce.price({ min: 1000, max: 5000 }),
            minAcceptedPrice: faker.commerce.price({ min: 800, max: 1000 }),
            buyNowPrice: faker.commerce.price({ min: 6000, max: 10000 }),
          },
        },

        // STAGE 6: LEGAL
        legal: {
          create: {
            consentAgreed: true,
            anonymityPreference: random(["IDENTITY_DISCLOSURE", "ANONYMOUS"]), // Uppercase
          },
        },
      },
    });
  }

  console.log("✅ Random Users seeded");
  console.log("🌱 Seeding Completed Successfully.");

  // 4. SETTINGS
  const defaultSettings = [
    { key: "BUSINESS_NAME", value: "Helix Fertility" },
    { key: "ADMIN_EMAIL", value: "admin@helix.com" },
    { key: "LOGO_PATH", value: "https://helix.com/logo.png" },
    { key: "POLICY_LINK", value: "https://helix.com/policy" },
    { key: "SOCIAL_FB", value: "https://facebook.com/helix" },
    { key: "SOCIAL_X", value: "https://x.com/helix" },
    { key: "MAIL_FOOTER_TEXT", value: "Best of Luck, Team Helix" },
    // SMTP (Mock values)
    { key: "SMTP_HOST", value: "smtp.mailtrap.io" },
    { key: "SMTP_PORT", value: "2525" },
    { key: "SMTP_USERNAME", value: "user" },
    { key: "SMTP_PASSWORD", value: "pass" },
    { key: "SMTP_FROM", value: "no-reply@helix.com" },
  ];

  for (const s of defaultSettings) {
    await prisma.settings.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }
  console.log("✅ Settings seeded");

  console.log("🌱 Starting RBAC Seeding...");

  // 1. Define All Possible Permissions
  const permissions = [
    // Settings
    { slug: "settings.view", description: "View system settings" },
    {
      slug: "settings.manage",
      description: "Update system settings (SMTP, Business Name)",
    },

    // User Management
    { slug: "users.view", description: "View user list" },
    { slug: "users.manage", description: "Ban, delete, or edit users" },

    // Profile Moderation
    {
      slug: "profiles.view_pending",
      description: "View profiles waiting for review",
    },
    { slug: "profiles.approve", description: "Approve or Reject profiles" },
    {
      slug: "profiles.view_sensitive",
      description: "View private health/genetic data",
    },

    // Admin Dashboard
    { slug: "dashboard.view", description: "View admin analytics" },
  ];

  // Upsert Permissions
  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    });
  }

  // 2. Define Default Roles

  // A. SUPER ADMIN (Has EVERYTHING)
  const allPermissions = await prisma.permission.findMany();

  await prisma.role.upsert({
    where: { name: "Super Admin" },
    update: {
      permissions: {
        set: allPermissions.map((p) => ({ id: p.id })), // Link all
      },
    },
    create: {
      name: "Super Admin",
      description: "Full system access",
      isSystem: true,
      permissions: {
        connect: allPermissions.map((p) => ({ id: p.id })),
      },
    },
  });

  // B. MODERATOR (Can approve profiles but NOT change Settings)
  const modPermissions = allPermissions.filter(
    (p) =>
      p.slug.startsWith("profiles.") ||
      p.slug === "users.view" ||
      p.slug === "dashboard.view"
  );

  await prisma.role.upsert({
    where: { name: "Moderator" },
    update: {
      permissions: { set: modPermissions.map((p) => ({ id: p.id })) },
    },
    create: {
      name: "Moderator",
      description: "Can review profiles and view users",
      permissions: { connect: modPermissions.map((p) => ({ id: p.id })) },
    },
  });

  // C. STANDARD USER (No Admin permissions)
  // Usually empty permissions for the Admin Panel, but we create the role exists
  await prisma.role.upsert({
    where: { name: "User" },
    update: {},
    create: { name: "User", description: "Standard App User", isSystem: true },
  });

  console.log("✅ RBAC Roles & Permissions Seeded");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import prisma from "../src/config/prisma.js";
import { faker } from "@faker-js/faker";

// Helper for random selection
const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Options matching Schema Enums (Case Sensitive)
const DIET_OPTIONS = [
  "OMNIVORE",
  "VEGETARIAN",
  "VEGAN",
  "KOSHER",
  "HALAL",
  "GLUTEN_FREE",
];
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
  // 1. PERMISSIONS
  // =======================================================
  const permissions = [
    { slug: "settings.view", description: "View system settings" },
    { slug: "settings.manage", description: "Update system settings" },
    { slug: "users.view", description: "View user list" },
    { slug: "users.manage", description: "Ban, delete, or edit users" },
    {
      slug: "profiles.view_pending",
      description: "View profiles waiting for review",
    },
    { slug: "profiles.approve", description: "Approve or Reject profiles" },
    {
      slug: "profiles.view_sensitive",
      description: "View private health/genetic data",
    },
    { slug: "roles.manage", description: "Manage roles" },
    { slug: "dashboard.view", description: "View admin analytics" },
  ];

  console.log("Creating permissions...");
  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { slug: p.slug },
      update: { description: p.description },
      create: p,
    });
  }
  console.log("✅ Permissions seeded");

  // =======================================================
  // 2. ROLES (using prisma.role - matching schema model name)
  // =======================================================
  const allPermissions = await prisma.permission.findMany();

  // A. SUPER ADMIN (Has EVERYTHING)
  const superAdminRole = await prisma.role.upsert({
    where: { name: "Super Admin" },
    update: {
      description: "Full system access",
      permissions: {
        set: allPermissions.map((p) => ({ id: p.id })),
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
  console.log("✅ Super Admin role created with ID:", superAdminRole.id);

  // B. MODERATOR
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
  console.log("✅ Moderator role seeded");

  // C. STANDARD USER (No Admin permissions)
  await prisma.role.upsert({
    where: { name: "User" },
    update: {},
    create: {
      name: "User",
      description: "Standard App User",
      isSystem: true,
    },
  });
  console.log("✅ User role seeded");

  // =======================================================
  // 3. SUPER ADMIN USER
  // =======================================================
  const adminEmail = process.env.ADMIN_EMAIL || "admin@helix.com";

  const superAdmin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      accessRoleId: superAdminRole.id,
      profileStatus: "ACTIVE",
      termsAccepted: true,
      onboardingStep: 6,
    },
    create: {
      email: adminEmail,
      accessRoleId: superAdminRole.id,
      profileStatus: "ACTIVE",
      termsAccepted: true,
      onboardingStep: 6,
    },
  });
  console.log(
    `✅ Super Admin user created: ${superAdmin.email} (accessRoleId: ${superAdmin.accessRoleId})`
  );

  // =======================================================
  // 4. PLANS
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
  // 5. SETTINGS
  // =======================================================
  const defaultSettings = [
    { key: "BUSINESS_NAME", value: "Helix Fertility" },
    { key: "ADMIN_EMAIL", value: adminEmail },
    { key: "LOGO_PATH", value: "https://helix.com/logo.png" },
    { key: "POLICY_LINK", value: "https://helix.com/policy" },
    { key: "SOCIAL_FB", value: "https://facebook.com/helix" },
    { key: "SOCIAL_X", value: "https://x.com/helix" },
    { key: "MAIL_FOOTER_TEXT", value: "Best of Luck, Team Helix" },
  ];

  for (const s of defaultSettings) {
    await prisma.settings.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }
  console.log("✅ Settings seeded");

  // =======================================================
  // 6. TEST USERS
  // =======================================================

  // --- Fresh User (No Onboarding) ---
  await prisma.user.upsert({
    where: { email: "new@helix.com" },
    update: {},
    create: {
      email: "new@helix.com",
      onboardingStep: 0,
    },
  });
  console.log("👉 Created Fresh User: new@helix.com");

  // --- Onboarded User (Pending Profile) ---
  await prisma.user.upsert({
    where: { email: "onboarded@helix.com" },
    update: { onboardingStep: 0 },
    create: {
      email: "onboarded@helix.com",
      onboardingStep: 0,
      termsAccepted: true,
      gender: "WOMAN",
      role: "DONOR",
      serviceType: "DONOR_SERVICES",
      interestedIn: null,
      pairingTypes: ["DONOR_BANK"],
    },
  });
  console.log("👉 Created Onboarded User: onboarded@helix.com");

  // --- Partial User (Stage 2) ---
  await prisma.user.upsert({
    where: { email: "partial@helix.com" },
    update: { onboardingStep: 2 },
    create: {
      email: "partial@helix.com",
      onboardingStep: 2,
      termsAccepted: true,
      gender: "MAN",
      role: "DONOR",
      serviceType: "DONOR_SERVICES",
      pairingTypes: ["PRIVATE_DONATION_ONLY"],
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

  // --- Complete User ---
  await prisma.user.upsert({
    where: { email: "complete@helix.com" },
    update: { onboardingStep: 6 },
    create: {
      email: "complete@helix.com",
      onboardingStep: 6,
      termsAccepted: true,
      gender: "MAN",
      role: "DONOR",
      serviceType: "DONOR_SERVICES",
      pairingTypes: ["PRIVATE_CO_PARENTING"],
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

  // =======================================================
  // 7. RANDOM USERS (Optional - can be skipped if not needed)
  // =======================================================
  const NUM_USERS = 20;
  console.log(`...Generating ${NUM_USERS} random users...`);

  for (let i = 0; i < NUM_USERS; i++) {
    const sex = random(["male", "female"]);
    const firstName = faker.person.firstName(sex);
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();

    // Skip if email already exists
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) continue;

    await prisma.user.create({
      data: {
        email,
        role: "DONOR",
        serviceType: "DONOR_SERVICES",
        onboardingStep: 6,
        termsAccepted: true,
        gender: sex === "male" ? "MAN" : "WOMAN",
        pairingTypes: ["PRIVATE_DONATION_ONLY"],
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
            diet: random(DIET_OPTIONS),
            race: random(RACE_OPTIONS),
            orientation: random(ORIENTATION_OPTIONS),
            education: random(["High School", "Bachelor", "Master", "PhD"]),
            occupation: faker.person.jobTitle(),
            babyPhotoUrl: faker.image.url({ height: 400, width: 400 }),
            currentPhotoUrl: faker.image.url({ height: 400, width: 400 }),
          },
        },
        health: {
          create: {
            isPrivate: true,
            hasDiabetes: faker.datatype.boolean(0.1),
            hasHeartCondition: false,
            hasAutoimmune: false,
            allergies: faker.datatype.boolean(),
            allergiesDetails: "Seasonal Pollen",
            cmvStatus: random(["POSITIVE", "NEGATIVE", "NOT_SURE"]),
            mentalHealthHistory: "None",
            hivHepStatus: false,
            menstrualRegularity: sex === "female" ? true : null,
            pregnancyHistory:
              sex === "female" ? faker.datatype.boolean() : null,
          },
        },
        genetic: {
          create: {
            carrierConditions: faker.datatype.boolean() ? ["CFTR", "SMA"] : [],
            reportFileUrl: "https://example.com/dummy-report.pdf",
          },
        },
        compensation: {
          create: {
            isInterested: true,
            allowBidding: faker.datatype.boolean(),
            askingPrice: parseFloat(
              faker.commerce.price({ min: 1000, max: 5000 })
            ),
            minAcceptedPrice: parseFloat(
              faker.commerce.price({ min: 800, max: 1000 })
            ),
            buyNowPrice: parseFloat(
              faker.commerce.price({ min: 6000, max: 10000 })
            ),
          },
        },
        legal: {
          create: {
            consentAgreed: true,
            anonymityPreference: random(["IDENTITY_DISCLOSURE", "ANONYMOUS"]),
          },
        },
      },
    });
  }
  console.log("✅ Random Users seeded");

  console.log("🌱 Seeding Completed Successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

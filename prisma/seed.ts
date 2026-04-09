import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // Demo users with hashed passwords
  const demoUsers = [
    {
      email: 'admin@waste.com',
      name: 'Admin User',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LrUpm', // admin123
      role: 'ADMIN'
    },
    {
      email: 'agent@waste.com',
      name: 'Agent User',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LrUpm', // agent123
      role: 'AGENT'
    },
    {
      email: 'household@waste.com',
      name: 'Household User',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LrUpm', // household123
      role: 'HOUSEHOLD'
    },
    {
      email: 'recycler@waste.com',
      name: 'Recycler User',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LrUpm', // recycler123
      role: 'RECYCLER'
    },
    {
      email: 'investor@waste.com',
      name: 'Investor User',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LrUpm', // investor123
      role: 'INVESTOR'
    },
    {
      email: 'government@waste.com',
      name: 'Government User',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LrUpm', // government123
      role: 'GOVERNMENT'
    }
  ]

  // Create demo users
  for (const userData of demoUsers) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      })

      if (existingUser) {
        console.log(`User ${userData.email} already exists, skipping...`)
        continue
      }

      const user = await prisma.user.create({
        data: userData
      })

      console.log(`Created user: ${user.email} with role: ${user.role}`)

      // Create role-specific profiles
      switch (userData.role) {
        case 'AGENT':
          await prisma.agentProfile.create({
            data: {
              userId: user.id,
              employeeId: `EMP${Date.now()}`,
              department: 'Collections',
              status: 'ACTIVE'
            }
          })
          console.log(`Created agent profile for ${user.email}`)
          break

        case 'HOUSEHOLD':
          await prisma.householdProfile.create({
            data: {
              userId: user.id,
              householdSize: 4,
              subscriptionPlan: 'BASIC',
              billingCycle: 'MONTHLY',
              address: '123 Demo Street, Demo City'
            }
          })
          console.log(`Created household profile for ${user.email}`)
          break

        case 'RECYCLER':
          await prisma.recyclerProfile.create({
            data: {
              userId: user.id,
              companyName: 'Demo Recycling Co.',
              registrationNumber: `REG${Date.now()}`,
              contactPerson: user.name,
              businessType: 'Recycling Services'
            }
          })
          console.log(`Created recycler profile for ${user.email}`)
          break

        case 'INVESTOR':
          await prisma.investorProfile.create({
            data: {
              userId: user.id,
              investorType: 'INDIVIDUAL',
              riskTolerance: 'MEDIUM'
            }
          })
          console.log(`Created investor profile for ${user.email}`)
          break

        case 'GOVERNMENT':
          await prisma.governmentProfile.create({
            data: {
              userId: user.id,
              department: 'Environmental Protection',
              position: 'Demo Officer',
              jurisdiction: 'Demo City',
              accessLevel: 'BASIC'
            }
          })
          console.log(`Created government profile for ${user.email}`)
          break
      }
    } catch (error) {
      console.error(`Error creating user ${userData.email}:`, error)
    }
  }

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

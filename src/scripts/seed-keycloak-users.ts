import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { config } from 'dotenv';

// Load environment variables
config();

/**
 * Keycloak User Seeding Script
 *
 * Seeds Keycloak with test users for development and testing.
 * Creates users with the "user" role assigned.
 *
 * Usage:
 *   ts-node src/scripts/seed-keycloak-users.ts
 *   or
 *   npm run seed:keycloak
 */

interface UserToCreate {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    enabled: boolean;
    emailVerified: boolean;
    roles: string[];
}

async function seedKeycloakUsers() {
    const keycloakUrl = process.env.KEYCLOAK_URL || 'http://localhost:8080';
    const realm = process.env.KEYCLOAK_REALM || 'b2b-ecommerce';
    const adminUser = process.env.KEYCLOAK_ADMIN_USER || 'admin';
    const adminPassword = process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin';

    console.log('🔐 Starting Keycloak user seeding...');
    console.log(`   Keycloak URL: ${keycloakUrl}`);
    console.log(`   Realm: ${realm}`);
    console.log(`   Admin User: ${adminUser}`);

    try {
        // Initialize Keycloak Admin Client
        const keycloakAdmin = new KeycloakAdminClient({
            baseUrl: keycloakUrl,
            realmName: 'master', // Use master realm for admin authentication
        });

        // Authenticate with admin credentials (using admin-cli which is public)
        console.log('\n🔑 Authenticating with Keycloak Admin...');
        await keycloakAdmin.auth({
            grantType: 'password',
            clientId: 'admin-cli', // Default admin client (public, no secret needed)
            username: adminUser,
            password: adminPassword,
        });
        console.log('✅ Authenticated successfully');

        // Switch to target realm
        keycloakAdmin.setConfig({
            realmName: realm,
        });

        // Define users to create
        const usersToCreate: UserToCreate[] = [
            {
                username: 'user',
                email: 'user@example.com',
                firstName: 'Test',
                lastName: 'User',
                password: 'user123', // In production, this should be changed on first login
                enabled: true,
                emailVerified: true,
                roles: ['user'],
            },
            {
                username: 'buyer1',
                email: 'buyer1@example.com',
                firstName: 'John',
                lastName: 'Buyer',
                password: 'buyer123',
                enabled: true,
                emailVerified: true,
                roles: ['user'],
            },
            {
                username: 'buyer2',
                email: 'buyer2@example.com',
                firstName: 'Jane',
                lastName: 'Buyer',
                password: 'buyer123',
                enabled: true,
                emailVerified: true,
                roles: ['user'],
            },
        ];

        console.log(`\n👥 Creating ${usersToCreate.length} users...`);

        // Get realm roles to find "user" role
        const realmRoles = await keycloakAdmin.roles.find();
        const userRole = realmRoles.find(r => r.name === 'user');

        // If "user" role doesn't exist, create it
        if (!userRole) {
            console.log('\n📝 Creating "user" role...');
            await keycloakAdmin.roles.create({
                name: 'user',
                description: 'Standard user role for B2B e-commerce platform',
            });
            console.log('✅ "user" role created');
        }

        // Create users
        const createdUsers = [];
        for (const userData of usersToCreate) {
            try {
                // Check if user already exists
                const existingUsers = await keycloakAdmin.users.find({
                    username: userData.username,
                });

                if (existingUsers.length > 0) {
                    console.log(`   ⚠️  User "${userData.username}" already exists, skipping...`);
                    createdUsers.push(existingUsers[0]);
                    continue;
                }

                // Create user
                const createdUser = await keycloakAdmin.users.create({
                    username: userData.username,
                    email: userData.email,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    enabled: userData.enabled,
                    emailVerified: userData.emailVerified,
                    credentials: [
                        {
                            type: 'password',
                            value: userData.password,
                            temporary: false, // Password is permanent (user should change it in production)
                        },
                    ],
                });

                console.log(`   ✅ Created user: ${userData.username} (${userData.email})`);

                // Assign "user" role to the user
                if (userRole || (await keycloakAdmin.roles.findOneByName({ name: 'user' }))) {
                    const roleToAssign = userRole || (await keycloakAdmin.roles.findOneByName({ name: 'user' }));

                    if (roleToAssign) {
                        await keycloakAdmin.users.addRealmRoleMappings({
                            id: createdUser.id,
                            roles: [
                                {
                                    id: roleToAssign.id,
                                    name: roleToAssign.name,
                                },
                            ],
                        });
                        console.log(`      → Assigned "user" role`);
                    }
                }

                createdUsers.push(createdUser);
            } catch (error: any) {
                console.error(`   ❌ Failed to create user "${userData.username}":`, error.message || error);
            }
        }

        console.log(`\n✅ Successfully processed ${createdUsers.length} users`);

        console.log('\n📋 Created Users:');
        for (const user of createdUsers) {
            const userData = usersToCreate.find(u => u.username === user.username);
            console.log(`   - ${user.username} (${userData?.email}) - Password: ${userData?.password}`);
        }

        console.log('\n🌐 You can now login with any of these accounts:');
        console.log(`   Login URL: ${keycloakUrl}/realms/${realm}/account`);
        console.log(`   Application Login: http://localhost:3333/login`);

        console.log('\n🎉 Keycloak user seeding completed successfully!');

    } catch (error: any) {
        console.error('\n❌ Error seeding Keycloak users:', error.message || error);

        if (error.response) {
            console.error('   Response:', error.response.data || error.response.statusText);
        }

        throw error;
    }
}

// Run the seed script
seedKeycloakUsers()
    .then(() => {
        console.log('\n✅ Seeding script completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Seeding script failed:', error);
        process.exit(1);
    });


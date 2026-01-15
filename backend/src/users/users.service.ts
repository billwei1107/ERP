import { Injectable, NotFoundException, UnauthorizedException, ConflictException, OnModuleInit } from '@nestjs/common';

export enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF',
}

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(private prisma: PrismaService) { }

  // Hardcoded users for seeding only
  private readonly seedUsers = [
    {
      id: 100,
      name: 'Admin User',
      email: 'admin@erp.com',
      password: 'admin123',
      role: Role.ADMIN,
      empId: 'ADM001',
      avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff',
      bio: 'System Administrator',
      status: 'ONLINE',
      themePreference: 'light'
    },
    {
      id: 1,
      name: 'Bill Wei',
      email: 'bill@erp.com',
      password: 'user123',
      role: Role.STAFF,
      empId: 'EMP001',
      avatar: 'https://ui-avatars.com/api/?name=Bill+Wei&background=random',
      bio: 'Frontend Developer',
      status: 'BUSY',
      themePreference: 'light'
    },
    {
      id: 2,
      name: 'Jane Doe',
      email: 'jane@erp.com',
      password: 'user123',
      role: Role.STAFF,
      empId: 'EMP002',
      avatar: 'https://ui-avatars.com/api/?name=Jane+Doe&background=random',
      bio: 'Sales Representative',
      status: 'OFFLINE',
      themePreference: 'light'
    },
    {
      id: 3,
      name: 'John Smith',
      email: 'john@erp.com',
      password: 'user123',
      role: Role.STAFF,
      empId: 'EMP003',
      avatar: 'https://ui-avatars.com/api/?name=John+Smith&background=random',
      bio: 'Software Engineer',
      status: 'ONLINE',
      themePreference: 'light'
    },
    {
      id: 4,
      name: 'Alice Brown',
      email: 'alice@erp.com',
      password: 'user123',
      role: Role.STAFF,
      empId: 'EMP004',
      avatar: 'https://ui-avatars.com/api/?name=Alice+Brown&background=random',
      bio: 'HR Specialist',
      status: 'AWAY',
      themePreference: 'light'
    },
    {
      id: 5,
      name: 'Bob Wilson',
      email: 'bob@erp.com',
      password: 'user123',
      role: Role.STAFF,
      empId: 'EMP005',
      avatar: 'https://ui-avatars.com/api/?name=Bob+Wilson&background=random',
      bio: 'Marketing Lead',
      status: 'ONLINE',
      themePreference: 'light'
    },
    {
      id: 6,
      name: 'Carol White',
      email: 'carol@erp.com',
      password: 'user123',
      role: Role.STAFF,
      empId: 'EMP006',
      avatar: 'https://ui-avatars.com/api/?name=Carol+White&background=random',
      bio: 'Product Manager',
      status: 'BUSY',
      themePreference: 'light'
    },
    {
      id: 7,
      name: 'David Lee',
      email: 'david@erp.com',
      password: 'user123',
      role: Role.MANAGER,
      empId: 'EMP007',
      avatar: 'https://ui-avatars.com/api/?name=David+Lee&background=random',
      bio: 'Operations Manager',
      status: 'ONLINE',
      themePreference: 'light'
    }
  ];

  async onModuleInit() {
    // Seed hardcoded users to DB to ensure FK constraints work
    for (const user of this.seedUsers) {
      await this.prisma.user.upsert({
        where: { email: user.email },
        update: {}, // Don't overwrite if exists
        create: {
          id: user.id,
          email: user.email,
          empId: user.empId,
          name: user.name,
          password: user.password,
          role: user.role,
          status: user.status
        } as any // Use any to bypass strict typing if schema mismatch during seeding
      });
    }
    console.log('Seeded hardcoded users to DB');
  }

  async login(empIdOrEmail: string, pass: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: empIdOrEmail },
          { empId: empIdOrEmail }
        ]
      } as any
    });

    if (!user || user.password !== pass) {
      throw new UnauthorizedException('Invalid credentials');
    }
    // Return user without password
    const { password, ...result } = user;
    return result;
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      orderBy: { id: 'asc' }
    });
    return users.map(({ password, ...user }) => user);
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id }
    });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    const { password, ...result } = user;
    return result;
  }

  async update(id: number, updateUserDto: any) {
    const user = await this.prisma.user.update({
      where: { id },
      data: updateUserDto
    });
    const { password, ...result } = user;
    return result;
  }

  async create(createUserDto: any) {
    try {
      // Generate empId if needed
      const lastUser = await this.prisma.user.findFirst({ orderBy: { id: 'desc' } });
      const newId = (lastUser?.id || 0) + 1;
      const generatedEmpId = createUserDto.empId || `EMP${String(newId).padStart(3, '0')}`;

      const newUser = await this.prisma.user.create({
        data: {
          ...createUserDto,
          password: createUserDto.password || 'user123',
          role: createUserDto.role || Role.STAFF,
          empId: generatedEmpId
        }
      });

      const { password, ...result } = newUser;
      return result;
    } catch (e: any) {
      console.error('Create User Error:', e);
      if (e.code === 'P2002') {
        throw new ConflictException('Email or Employee ID already exists. Please try again.');
      }
      throw new Error('Failed to create user: ' + e.message);
    }
  }

  async remove(id: number) {
    const user = await this.prisma.user.delete({
      where: { id }
    });
    const { password, ...result } = user;
    return result;
  }
}

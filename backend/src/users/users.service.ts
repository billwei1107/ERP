import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';

export enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF',
}

@Injectable()
export class UsersService {
  private users = [
    {
      id: 100,
      name: 'Admin User',
      email: 'admin@erp.com',
      password: 'admin123', // In real app, this should be hashed
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

  async login(empIdOrEmail: string, pass: string) {
    const user = this.users.find(u => u.empId === empIdOrEmail || u.email === empIdOrEmail);
    if (!user || user.password !== pass) {
      throw new UnauthorizedException('Invalid credentials');
    }
    // Return user without password
    const { password, ...result } = user;
    return result;
  }

  async findAll() {
    return this.users.map(({ password, ...user }) => user);
  }

  async findOne(id: number) {
    const user = this.users.find(u => u.id === id);
    if (!user) throw new NotFoundException(`User #${id} not found`);
    const { password, ...result } = user;
    return result;
  }

  async update(id: number, updateUserDto: any) {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) throw new NotFoundException(`User #${id} not found`);

    this.users[index] = { ...this.users[index], ...updateUserDto };
    const { password, ...result } = this.users[index];
    return result;
  }

  async create(createUserDto: any) {
    const newId = Math.max(...this.users.map(u => u.id)) + 1;
    const newUser = {
      id: newId,
      ...createUserDto,
      password: createUserDto.password || 'user123', // Default password if not provided
      empId: createUserDto.empId || `EMP${String(newId).padStart(3, '0')}`,
    };
    this.users.push(newUser);
    const { password, ...result } = newUser;
    return result;
  }

  async remove(id: number) {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) throw new NotFoundException(`User #${id} not found`);

    const removedUser = this.users[index];
    this.users = this.users.filter(u => u.id !== id);
    const { password, ...result } = removedUser;
    return result;
  }
}

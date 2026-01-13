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
    },
    {
      id: 1,
      name: 'Bill Wei',
      email: 'bill@erp.com',
      password: 'user123',
      role: Role.STAFF,
      empId: 'EMP001',
    },
    {
      id: 2,
      name: 'Jane Doe',
      email: 'jane@erp.com',
      password: 'user123',
      role: Role.STAFF,
      empId: 'EMP002',
    },
    {
      id: 3,
      name: 'John Smith',
      email: 'john@erp.com',
      password: 'user123',
      role: Role.STAFF,
      empId: 'EMP003',
    },
    {
      id: 4,
      name: 'Alice Brown',
      email: 'alice@erp.com',
      password: 'user123',
      role: Role.STAFF,
      empId: 'EMP004',
    },
    {
      id: 5,
      name: 'Bob Wilson',
      email: 'bob@erp.com',
      password: 'user123',
      role: Role.STAFF,
      empId: 'EMP005',
    },
    {
      id: 6,
      name: 'Carol White',
      email: 'carol@erp.com',
      password: 'user123',
      role: Role.STAFF,
      empId: 'EMP006',
    },
    {
      id: 7,
      name: 'David Lee',
      email: 'david@erp.com',
      password: 'user123',
      role: Role.MANAGER,
      empId: 'EMP007',
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

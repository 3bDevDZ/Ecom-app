/**
 * User Entity
 */
export interface UserProps {
  id: string;
  email: string;
  password: string; // hashed
  name: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private constructor(private props: UserProps) {
    this.validate();
  }

  static create(props: UserProps): User {
    return new User(props);
  }

  getId(): string {
    return this.props.id;
  }

  getEmail(): string {
    return this.props.email;
  }

  getPassword(): string {
    return this.props.password;
  }

  getName(): string {
    return this.props.name;
  }

  getPhone(): string | undefined {
    return this.props.phone;
  }

  getCreatedAt(): Date {
    return this.props.createdAt;
  }

  getUpdatedAt(): Date {
    return this.props.updatedAt;
  }

  toJSON() {
    return {
      id: this.props.id,
      email: this.props.email,
      name: this.props.name,
      phone: this.props.phone,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }

  private validate(): void {
    if (!this.props.id) {
      throw new Error('User ID is required');
    }
    if (!this.props.email?.trim()) {
      throw new Error('Email is required');
    }
    if (!this.props.email.includes('@')) {
      throw new Error('Invalid email format');
    }
    if (!this.props.name?.trim()) {
      throw new Error('Name is required');
    }
  }
}

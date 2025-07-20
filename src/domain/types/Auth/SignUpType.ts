export interface SignUpRequest {
    email: string;
    password: string;
    name: string;
  }

export interface SignUpResponse {
  message: string;
  access_token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

// Extra Validation: Existing email, password>=6, email format.


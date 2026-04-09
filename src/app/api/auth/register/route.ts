import { NextResponse } from "next/server";
import { createManagedUser } from "@/lib/user-management";
import { isValidRole } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const { name, email, password, role } = await request.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 },
      );
    }

    const normalizedRole = String(role).trim().toUpperCase();
    if (!isValidRole(normalizedRole)) {
      return NextResponse.json(
        { error: "Invalid role selected." },
        { status: 400 },
      );
    }

    const user = await createManagedUser({
      name: String(name),
      email: String(email),
      password: String(password),
      role: normalizedRole,
      address: undefined,
      phone: undefined,
    });

    return NextResponse.json(
      {
        message: "User created successfully.",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Registration failed.";
    const status = message.includes("already exists") ? 409 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}

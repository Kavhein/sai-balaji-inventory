'use server'
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { recordLog } from "@/app/actions";

export async function login(formData: FormData) {
    const password = formData.get("password");
    const role = formData.get("role") as string; // 'admin' or 'sister'

    let isValid = false;
    if (role === "admin" && password === "SAI123") isValid = true;
    if (role === "sister" && password === "LOOP27") isValid = true;

    if (isValid) {
        const cookieStore = await cookies();
        cookieStore.set("auth_session", role, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: "/",
        });
        await recordLog("LOGIN", `User logged in as ${role}`);
        redirect("/");
    } else {
        redirect(`/login?error=true&role=${role}`);
    }
}

export async function logout() {
    const role = await getSession();
    const cookieStore = await cookies();
    cookieStore.delete("auth_session");
    if (role) {
        await recordLog("LOGOUT", `User ${role} logged out`);
    }
    redirect("/login");
}

export async function getSession() {
    const cookieStore = await cookies();
    const session = cookieStore.get("auth_session");
    return session?.value || null;
}

export async function checkAuth() {
    const role = await getSession();
    return !!role;
}

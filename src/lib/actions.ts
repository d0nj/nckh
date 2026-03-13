"use server";

import { updateTag, refresh } from "next/cache";

export async function revalidateDashboard() {
  updateTag("dashboard");
}

export async function revalidateStudents() {
  updateTag("students");
}

export async function revalidateCourses() {
  updateTag("courses");
}

export async function revalidateClasses() {
  updateTag("classes");
}

export async function revalidatePrograms() {
  updateTag("programs");
}

export async function revalidateExams() {
  updateTag("exams");
}

export async function revalidateGrades() {
  updateTag("grades");
}

export async function revalidatePayments() {
  updateTag("payments");
}

export async function revalidateDebts() {
  updateTag("debts");
}

export async function revalidateCertificates() {
  updateTag("certificates");
}

export async function revalidateNotifications() {
  updateTag("notifications");
}

export async function revalidateEnrollments() {
  updateTag("enrollments");
}

export async function revalidateReports() {
  updateTag("reports");
}

export async function revalidateFinance() {
  updateTag("payments");
  updateTag("debts");
}

export async function revalidateStudentData(userId: string) {
  updateTag(`student-${userId}`);
}

export async function refreshClientCache() {
  refresh();
}

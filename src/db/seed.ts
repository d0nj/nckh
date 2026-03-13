import { auth } from "@/lib/auth";
import { db } from "./index";
import {
  programs,
  courses,
  classes,
  enrollments,
  exams,
  grades,
  payments,
  debts,
  notifications,
  studentProfiles,
  certificates,
  user,
} from "./schema";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("🌱 Đang tạo dữ liệu mẫu...");

  // ============================
  // USERS via Better Auth API
  // ============================

  // Admin
  const adminRes = await auth.api.signUpEmail({
    body: {
      email: "admin@nckh.edu.vn",
      password: "admin123",
      name: "Quản trị viên",
    },
  });
  const adminId = adminRes.user.id;
  await db
    .update(user)
    .set({ role: "admin", phone: "0901234567", gender: "male" })
    .where(eq(user.id, adminId));

  // Staff
  const staffRes = await auth.api.signUpEmail({
    body: {
      email: "staff@nckh.edu.vn",
      password: "staff123",
      name: "Nguyễn Văn Quản",
    },
  });
  const staffId = staffRes.user.id;
  await db
    .update(user)
    .set({ role: "staff", phone: "0901234568", gender: "male" })
    .where(eq(user.id, staffId));

  // Lecturers
  const lecturerData = [
    { name: "PGS.TS Trần Minh Đức", email: "duc.tm@nckh.edu.vn", gender: "male" as const },
    { name: "TS. Nguyễn Thị Hoa", email: "hoa.nt@nckh.edu.vn", gender: "female" as const },
    { name: "ThS. Lê Văn Phong", email: "phong.lv@nckh.edu.vn", gender: "male" as const },
  ];
  const lecturerIds: string[] = [];
  for (const lect of lecturerData) {
    const res = await auth.api.signUpEmail({
      body: { email: lect.email, password: "lecturer123", name: lect.name },
    });
    lecturerIds.push(res.user.id);
    await db
      .update(user)
      .set({
        role: "lecturer",
        phone: "090" + Math.floor(1000000 + Math.random() * 9000000),
        gender: lect.gender,
      })
      .where(eq(user.id, res.user.id));
  }

  // Students
  const studentData = [
    { name: "Phạm Văn An", email: "an.pv@student.nckh.edu.vn", gender: "male" as const },
    { name: "Lê Thị Bình", email: "binh.lt@student.nckh.edu.vn", gender: "female" as const },
    { name: "Hoàng Minh Châu", email: "chau.hm@student.nckh.edu.vn", gender: "female" as const },
    { name: "Ngô Đức Dũng", email: "dung.nd@student.nckh.edu.vn", gender: "male" as const },
    { name: "Vũ Thị Hương", email: "huong.vt@student.nckh.edu.vn", gender: "female" as const },
    { name: "Trần Quốc Khánh", email: "khanh.tq@student.nckh.edu.vn", gender: "male" as const },
    { name: "Đinh Văn Long", email: "long.dv@student.nckh.edu.vn", gender: "male" as const },
    { name: "Bùi Thị Mai", email: "mai.bt@student.nckh.edu.vn", gender: "female" as const },
  ];
  const studentIds: string[] = [];
  for (let i = 0; i < studentData.length; i++) {
    const s = studentData[i];
    const res = await auth.api.signUpEmail({
      body: { email: s.email, password: "student123", name: s.name },
    });
    studentIds.push(res.user.id);
    await db
      .update(user)
      .set({
        role: "student",
        phone: "098" + Math.floor(1000000 + Math.random() * 9000000),
        gender: s.gender,
      })
      .where(eq(user.id, res.user.id));
    await db.insert(studentProfiles).values({
      id: nanoid(),
      userId: res.user.id,
      studentCode: `SV${String(2026001 + i)}`,
      enrollmentDate: "2026-01-15",
    });
  }

  // ============================
  // PROGRAMS
  // ============================
  const programData = [
    {
      id: nanoid(), code: "CNTT-NH01", name: "Lập trình Web Full-stack",
      description: "Chương trình đào tạo ngắn hạn về lập trình web full-stack với React, Node.js",
      type: "short_term" as const, durationHours: 120, totalCredits: 8, tuitionFee: 5000000, status: "active" as const,
    },
    {
      id: nanoid(), code: "CNTT-NH02", name: "Phân tích dữ liệu với Python",
      description: "Khóa học phân tích dữ liệu, machine learning cơ bản với Python",
      type: "certificate" as const, durationHours: 90, totalCredits: 6, tuitionFee: 4000000, status: "active" as const,
    },
    {
      id: nanoid(), code: "KT-NH01", name: "Kế toán doanh nghiệp",
      description: "Chương trình đào tạo kế toán thực hành cho doanh nghiệp vừa và nhỏ",
      type: "diploma" as const, durationHours: 200, totalCredits: 12, tuitionFee: 8000000, status: "active" as const,
    },
    {
      id: nanoid(), code: "NN-NH01", name: "Tiếng Anh giao tiếp B1",
      description: "Khóa học tiếng Anh giao tiếp đạt chuẩn B1 châu Âu",
      type: "certificate" as const, durationHours: 150, totalCredits: 10, tuitionFee: 6000000, status: "active" as const,
    },
  ];
  for (const p of programData) {
    await db.insert(programs).values(p);
  }

  // ============================
  // COURSES
  // ============================
  const courseData = [
    { id: nanoid(), programId: programData[0].id, code: "WEB101", name: "HTML, CSS & JavaScript cơ bản", credits: 2, hours: 30, order: 1 },
    { id: nanoid(), programId: programData[0].id, code: "WEB102", name: "React.js & Next.js", credits: 3, hours: 45, order: 2 },
    { id: nanoid(), programId: programData[0].id, code: "WEB103", name: "Node.js & Express", credits: 2, hours: 30, order: 3 },
    { id: nanoid(), programId: programData[0].id, code: "WEB104", name: "Database & API Design", credits: 1, hours: 15, order: 4 },
    { id: nanoid(), programId: programData[1].id, code: "DA101", name: "Python cơ bản", credits: 2, hours: 30, order: 1 },
    { id: nanoid(), programId: programData[1].id, code: "DA102", name: "Pandas & NumPy", credits: 2, hours: 30, order: 2 },
    { id: nanoid(), programId: programData[1].id, code: "DA103", name: "Machine Learning cơ bản", credits: 2, hours: 30, order: 3 },
  ];
  for (const c of courseData) {
    await db.insert(courses).values(c);
  }

  // ============================
  // CLASSES
  // ============================
  const classData = [
    {
      id: nanoid(), courseId: courseData[0].id, lecturerId: lecturerIds[0],
      code: "WEB101-01", name: "HTML/CSS/JS - Lớp 1",
      maxStudents: 30, currentStudents: 5, room: "A201",
      schedule: JSON.stringify([
        { day: 2, startTime: "08:00", endTime: "10:00" },
        { day: 4, startTime: "08:00", endTime: "10:00" },
      ]),
      startDate: "2026-03-01", endDate: "2026-05-30", status: "in_progress" as const,
    },
    {
      id: nanoid(), courseId: courseData[1].id, lecturerId: lecturerIds[1],
      code: "WEB102-01", name: "React & Next.js - Lớp 1",
      maxStudents: 25, currentStudents: 4, room: "B301",
      schedule: JSON.stringify([{ day: 3, startTime: "14:00", endTime: "17:00" }]),
      startDate: "2026-04-01", endDate: "2026-06-30", status: "open" as const,
    },
    {
      id: nanoid(), courseId: courseData[4].id, lecturerId: lecturerIds[2],
      code: "DA101-01", name: "Python cơ bản - Lớp 1",
      maxStudents: 35, currentStudents: 6, room: "C102",
      schedule: JSON.stringify([
        { day: 2, startTime: "14:00", endTime: "16:00" },
        { day: 5, startTime: "14:00", endTime: "16:00" },
      ]),
      startDate: "2026-02-15", endDate: "2026-04-30", status: "in_progress" as const,
    },
  ];
  for (const cl of classData) {
    await db.insert(classes).values(cl);
  }

  // ============================
  // ENROLLMENTS
  // ============================
  for (let i = 0; i < 5; i++) {
    await db.insert(enrollments).values({
      id: nanoid(),
      studentId: studentIds[i],
      classId: classData[0].id,
      status: "enrolled",
    });
  }
  for (let i = 1; i < 5; i++) {
    await db.insert(enrollments).values({
      id: nanoid(),
      studentId: studentIds[i],
      classId: classData[1].id,
      status: i < 4 ? "enrolled" : "waitlisted",
      waitlistPosition: i >= 4 ? 1 : undefined,
    });
  }
  for (let i = 2; i < 8; i++) {
    await db.insert(enrollments).values({
      id: nanoid(),
      studentId: studentIds[i],
      classId: classData[2].id,
      status: "enrolled",
    });
  }

  // ============================
  // EXAMS
  // ============================
  const examData = [
    {
      id: nanoid(), classId: classData[0].id, name: "Kiểm tra giữa kỳ HTML/CSS",
      type: "midterm" as const, examDate: "2026-04-01", startTime: "08:00", endTime: "09:30",
      room: "A201", duration: 90, maxScore: 10, weight: 0.3, status: "completed" as const,
    },
    {
      id: nanoid(), classId: classData[0].id, name: "Thi cuối kỳ HTML/CSS/JS",
      type: "final" as const, examDate: "2026-05-25", startTime: "08:00", endTime: "10:00",
      room: "A201", duration: 120, maxScore: 10, weight: 0.7, status: "scheduled" as const,
    },
    {
      id: nanoid(), classId: classData[2].id, name: "Bài tập thực hành Python",
      type: "assignment" as const, examDate: "2026-03-20", startTime: "14:00", endTime: "16:00",
      room: "C102", duration: 120, maxScore: 10, weight: 0.4, status: "completed" as const,
    },
  ];
  for (const e of examData) {
    await db.insert(exams).values(e);
  }

  // ============================
  // GRADES
  // ============================
  for (let i = 0; i < 5; i++) {
    await db.insert(grades).values({
      id: nanoid(),
      examId: examData[0].id,
      studentId: studentIds[i],
      score: Math.round((6 + Math.random() * 4) * 10) / 10,
      status: "finalized",
      gradedBy: lecturerIds[0],
      gradedAt: "2026-04-03",
    });
  }
  for (let i = 2; i < 8; i++) {
    await db.insert(grades).values({
      id: nanoid(),
      examId: examData[2].id,
      studentId: studentIds[i],
      score: Math.round((5 + Math.random() * 5) * 10) / 10,
      status: "finalized",
      gradedBy: lecturerIds[2],
      gradedAt: "2026-03-22",
    });
  }

  // ============================
  // PAYMENTS
  // ============================
  const paymentMethods = ["cash", "bank_transfer", "credit_card", "e_wallet", "online"] as const;
  for (let i = 0; i < studentIds.length; i++) {
    await db.insert(payments).values({
      id: nanoid(),
      studentId: studentIds[i],
      amount: i < 5 ? 5000000 : 4000000,
      type: "tuition",
      method: paymentMethods[i % 5],
      status: i < 6 ? "completed" : "pending",
      description: `Học phí khóa ${i < 5 ? "Lập trình Web Full-stack" : "Phân tích dữ liệu với Python"}`,
      paidAt: i < 6 ? "2026-02-01" : undefined,
    });
  }

  // ============================
  // NOTIFICATIONS
  // ============================
  const notifTemplates = [
    { title: "Chào mừng bạn đến với hệ thống", content: "Tài khoản của bạn đã được kích hoạt thành công.", type: "success" as const },
    { title: "Lịch học mới", content: "Thời khóa biểu học kỳ mới đã được cập nhật.", type: "info" as const },
    { title: "Nhắc nhở đóng học phí", content: "Vui lòng hoàn thành đóng học phí trước ngày 15/03/2026.", type: "warning" as const },
    { title: "Điểm đã được cập nhật", content: "Điểm kiểm tra giữa kỳ môn HTML/CSS đã được công bố.", type: "grade" as const },
  ];
  for (const sid of studentIds) {
    for (const notif of notifTemplates) {
      await db.insert(notifications).values({
        id: nanoid(),
        userId: sid,
        ...notif,
      });
    }
  }

  // ============================
  // DEBTS (for VNPay payment testing)
  // ============================
  await db.insert(debts).values({
    id: nanoid(),
    studentId: studentIds[0],
    amount: 5000000,
    remainingAmount: 5000000,
    reason: "Học phí kỳ 1 - Lập trình Web Full-stack",
    dueDate: "2026-04-15",
    status: "active",
  });
  await db.insert(debts).values({
    id: nanoid(),
    studentId: studentIds[0],
    amount: 500000,
    remainingAmount: 500000,
    reason: "Phí thi cuối kỳ HTML/CSS/JS",
    dueDate: "2026-05-20",
    status: "active",
  });
  await db.insert(debts).values({
    id: nanoid(),
    studentId: studentIds[0],
    amount: 300000,
    remainingAmount: 300000,
    reason: "Phí cấp chứng chỉ",
    dueDate: "2026-03-01",
    status: "overdue",
  });
  // Debts for other students too
  for (let i = 1; i < 4; i++) {
    await db.insert(debts).values({
      id: nanoid(),
      studentId: studentIds[i],
      amount: i < 3 ? 4000000 : 8000000,
      remainingAmount: i < 3 ? 4000000 : 8000000,
      reason: i < 3 ? "Học phí - Phân tích dữ liệu với Python" : "Học phí - Kế toán doanh nghiệp",
      dueDate: "2026-04-30",
      status: "active",
    });
  }

  // ============================
  // CERTIFICATES
  // ============================
  await db.insert(certificates).values({
    id: nanoid(),
    studentId: studentIds[0],
    programId: programData[0].id,
    certificateNumber: "CC-2026-0001",
    registryNumber: "SG-2026-0001",
    type: "certificate",
    issueDate: "2026-03-01",
    classification: "good",
    gpa: 7.8,
    status: "issued",
    approvedBy: adminId,
    approvedAt: "2026-02-28",
    issuedBy: adminId,
    issuedAt: "2026-03-01",
  });

  console.log("✅ Tạo dữ liệu mẫu thành công!");
  console.log("\n📋 Tài khoản thử nghiệm:");
  console.log("  Admin:      admin@nckh.edu.vn / admin123");
  console.log("  Cán bộ:     staff@nckh.edu.vn / staff123");
  console.log("  Giảng viên: duc.tm@nckh.edu.vn / lecturer123");
  console.log("  Sinh viên:  an.pv@student.nckh.edu.vn / student123");
}

seed().catch(console.error);

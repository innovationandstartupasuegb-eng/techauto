import { prisma } from "../lib/prisma";

export default async function Home() {
  const students = await prisma.users.findMany();

  return (
    <main style={{ padding: '20px' }}>
      <h1>Ուսանողների ցուցակ</h1>
      <pre>{JSON.stringify(students, null, 2)}</pre>
    </main>
  );
}
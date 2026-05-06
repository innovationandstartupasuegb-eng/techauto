import Link from 'next/link';

export default function UserDashboard() {
  const menuItems = [
    { title: 'Ամրագրել տեխնիկա', path: '/reserve', color: 'bg-blue-500' },
    { title: 'Իմ ամրագրումները', path: '/myreservations', color: 'bg-green-500' },
  ];

  return (
    <div className="p-8 flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">Բարի գալուստ</h1>
      
      <div className="flex flex-col items-center gap-6 w-full max-w-md">
        {menuItems.map((item) => (
          <Link href={item.path} key={item.title} className="w-full">
            <div className={`${item.color} text-white p-8 rounded-xl shadow-lg hover:scale-105 transition duration-300 text-center cursor-pointer`}>
              <h2 className="text-2xl font-semibold">{item.title}</h2>
              <p className="mt-2 text-white/80">Սեղմեք անցնելու համար</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
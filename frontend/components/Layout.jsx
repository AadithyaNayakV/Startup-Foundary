// frontend/components/Layout.jsx
export default function Layout({ children, sidebar }) {
  return (
    <div className="flex bg-gray-50 min-h-screen">
      {sidebar}

      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}

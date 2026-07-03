interface Props { title: string; action?: React.ReactNode; }
export function PageHeader({ title, action }: Props) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {action}
    </div>
  );
}

export const renderStatusTag = (status: string) => {
  const map = {
    Salaried: { color: "#22c55e", text: "Lương cố định" },
    Commission: { color: "#3b82f6", text: "Hoa hồng" },
    Terminated: { color: "#fca5a5", text: "Đã nghỉ việc" },
  };

  const current = map[status as keyof typeof map];
  if (!current) return <span>{status}</span>;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: current.color,
        }}
      />
      <span style={{ color: current.color }}>{current.text}</span>
    </div>
  );
};
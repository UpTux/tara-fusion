export const isElectron = (): boolean => {
  return (
    typeof window !== "undefined" &&
    typeof (window as any).process !== "undefined" &&
    (window as any).process.type === "renderer"
  );
};

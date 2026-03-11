import AppNavbar from "./navbar";

export default async function Layout({ children }: LayoutProps<"/">) {
  return (
    <>
      <AppNavbar />
      {children}
    </>
  );
}

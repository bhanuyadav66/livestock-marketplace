import SellerProfileClient from "@/components/SellerProfileClient";

async function getUser(id) {
  const res = await fetch(`http://localhost:3000/api/users/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return null;
  }

  return res.json();
}

export default async function UserPage({ params }) {
  const { id } = await params;
  const data = await getUser(id);

  if (!data?.user) {
    return <div className="p-10">Seller not found.</div>;
  }

  return (
    <SellerProfileClient
      seller={{ ...data.user, listings: data.listings || [] }}
    />
  );
}

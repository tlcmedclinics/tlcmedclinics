"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { authedFetch } from "@/lib/authed-fetch";
import ServiceForm from "@/components/ServiceForm";
import type { Service } from "@/types";
import Loader from "@/components/Loader";

export default function EditServicePage() {
  const params = useParams<{ id: string }>();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authedFetch(`/api/services/${params.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setService)
      .finally(() => setLoading(false));
  }, [params.id]);

  return (
    <div className="animate-fade-up">
      <h1 className="h1">Edit Service</h1>
      {loading ? (
        <Loader className="mt-6" />
      ) : service ? (
        <ServiceForm service={service} />
      ) : (
        <p className="mt-6 text-sm text-ink-soft">Service not found.</p>
      )}
    </div>
  );
}

"use client";

import type { Lead } from "@/lib/types";
import { Building2, ExternalLink, Link, Mail } from "lucide-react";

interface Props {
  leads: Lead[];
}

export default function LeadsTable({ leads }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-xs uppercase text-zinc-500">
            <th className="py-3 pr-4">Company</th>
            <th className="px-4 py-3">Contact</th>
            <th className="px-4 py-3">Industry</th>
            <th className="px-4 py-3">Size</th>
            <th className="px-4 py-3">Location</th>
            <th className="px-4 py-3">Priority</th>
            <th className="px-4 py-3">Why now</th>
            <th className="px-4 py-3">Links</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.companyName} className="border-b border-zinc-100 align-top">
              <td className="py-4 pr-4">
                <div className="flex items-center gap-2 font-semibold text-zinc-950">
                  <Building2 className="h-4 w-4 text-teal-700" />
                  {lead.companyName}
                </div>
                <a
                  href={lead.website}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs text-teal-700"
                >
                  Website <ExternalLink className="h-3 w-3" />
                </a>
              </td>
              <td className="px-4 py-4">
                <div className="font-medium text-zinc-950">{lead.contactPerson}</div>
                <div className="text-xs text-zinc-500">{lead.jobTitle}</div>
              </td>
              <td className="px-4 py-4 text-zinc-600">{lead.industry}</td>
              <td className="px-4 py-4 text-zinc-600">{lead.employeeSize}</td>
              <td className="px-4 py-4 text-zinc-600">{lead.location}</td>
              <td className="px-4 py-4">
                <span className="rounded-full bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-800">
                  {lead.priorityScore}/10
                </span>
                <div className="mt-2 text-xs text-zinc-500">
                  {Math.round(lead.confidenceScore * 100)}% confidence
                </div>
              </td>
              <td className="px-4 py-4 text-zinc-600">{lead.relevanceReason}</td>
              <td className="px-4 py-4">
                <div className="flex gap-3">
                  {lead.linkedinProfile ? (
                    <a href={lead.linkedinProfile} target="_blank" rel="noreferrer">
                      <Link className="h-4 w-4 text-blue-700" />
                    </a>
                  ) : null}
                  {lead.businessEmail ? (
                    <a href={`mailto:${lead.businessEmail}`}>
                      <Mail className="h-4 w-4 text-zinc-700" />
                    </a>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

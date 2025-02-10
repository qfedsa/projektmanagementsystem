import React from 'react';
import { Trash2 } from 'lucide-react';
import type { Subcontractor } from '../types';

interface SubcontractorFormProps {
  subcontractor: Subcontractor;
  onUpdate: (field: keyof Subcontractor, value: string) => void;
  onDelete: () => void;
}

export function SubcontractorForm({ subcontractor, onUpdate, onDelete }: SubcontractorFormProps) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="text"
          value={subcontractor.name}
          onChange={(e) => onUpdate('name', e.target.value)}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="z.B. Maurer"
          required
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="text"
          value={subcontractor.contact_person}
          onChange={(e) => onUpdate('contact_person', e.target.value)}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Name des Ansprechpartners"
          required
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="email"
          value={subcontractor.email}
          onChange={(e) => onUpdate('email', e.target.value)}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="email@beispiel.de"
          required
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <button
          onClick={onDelete}
          className="text-red-600 hover:text-red-900"
          title="Subunternehmer löschen"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </td>
    </tr>
  );
}

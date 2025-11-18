'use client';

import { useTransition } from 'react';
import { approveAd } from './actions';

interface ApproveButtonProps {
  adId: string;
}

export default function ApproveButton({ adId }: ApproveButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleApprove = () => {
    startTransition(async () => {
      const result = await approveAd(adId);
      if (result.error) {
        alert(result.error);
      }
    });
  };

  return (
    <button onClick={handleApprove} disabled={isPending} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
      {isPending ? 'Aprobando...' : 'Aprobar'}
    </button>
  );
}

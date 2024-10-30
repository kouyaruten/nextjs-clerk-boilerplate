'use client';
import Image from 'next/image';
import { UserButton, useUser } from '@clerk/nextjs';

export default function DashboardPage() {
  const { user } = useUser();

  return (
    <div className="grid col-auto place-content-center p-8">
      <div className="flex flex-col items-center gap-4">
        <UserButton />

        <div className="mt-8 space-y-4">
          <h2 className="text-2xl font-bold">User Information</h2>

          {/* User Details */}
          <div className="space-y-2">
            <p>
              <span className="font-semibold">Email:</span> {user?.primaryEmailAddress?.emailAddress}
            </p>
            <p>
              <span className="font-semibold">Full Name:</span> {user?.fullName}
            </p>
            <p>
              <span className="font-semibold">User ID:</span> {user?.id}
            </p>
          </div>

          {/* Stripe Metadata */}
          <div className="mt-6">
            <h3 className="text-xl font-semibold">Membership Status</h3>
            <div className="mt-2 p-4 bg-gray-50 rounded-lg">
              <p>
                <span className="font-semibold">Status:</span> {user?.publicMetadata?.stripe?.status || 'Not available'}
              </p>
              <p>
                <span className="font-semibold">Payment:</span>{' '}
                {user?.publicMetadata?.stripe?.payment || 'Not available'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

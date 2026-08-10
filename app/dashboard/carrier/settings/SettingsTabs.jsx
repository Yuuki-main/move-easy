'use client'

import { useState } from 'react'
import {
  User, Building2, Phone, Briefcase, MapPin, Bell,
  Shield, Umbrella, Image, ChevronDown
} from 'lucide-react'

const TABS = [
  { id: 'identity', label: 'Identity', icon: User },
  { id: 'profile', label: 'Profile', icon: Building2 },
  { id: 'telephone', label: 'Telephone', icon: Phone },
  { id: 'company', label: 'Company', icon: Briefcase },
  { id: 'location', label: 'Location', icon: MapPin },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'verification', label: 'Verification', icon: Shield },
  { id: 'insurance', label: 'Insurance', icon: Umbrella },
  { id: 'photos', label: 'Photos', icon: Image },
]

export default function SettingsTabs({
  carrier,
  profile,
  userEmail,
  telephones: initialTelephones,
  documents: initialDocuments,
  insurance: initialInsurance,
  notifications: initialNotifications,
}) {
  const [activeTab, setActiveTab] = useState('identity')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const ActiveIcon = TABS.find((t) => t.id === activeTab)?.icon || User

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto flex max-w-5xl gap-6 px-4 py-6">
        {/* ── Desktop sidebar ── */}
        <nav className="hidden md:block w-56 shrink-0">
          <div className="sticky top-24 space-y-0.5">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  activeTab === id
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </nav>

        {/* ── Mobile dropdown ── */}
        <div className="md:hidden w-full mb-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900"
          >
            <span className="flex items-center gap-2">
              <ActiveIcon size={16} />
              {TABS.find((t) => t.id === activeTab)?.label}
            </span>
            <ChevronDown
              size={16}
              className={`transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {mobileMenuOpen && (
            <div className="mt-1 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-lg">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => {
                    setActiveTab(id)
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors text-left ${
                    activeTab === id
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Content ── */}
        <div className="flex-1 min-w-0">
          {activeTab === 'identity' && (
            <IdentityTab
              profile={profile}
              carrier={carrier}
              userEmail={userEmail}
            />
          )}
          {activeTab === 'profile' && (
            <ProfileTab carrier={carrier} />
          )}
          {activeTab === 'telephone' && (
            <TelephoneTab carrierId={carrier?.id} telephones={initialTelephones} />
          )}
          {activeTab === 'company' && (
            <CompanyTab carrier={carrier} />
          )}
          {activeTab === 'location' && (
            <LocationTab carrier={carrier} />
          )}
          {activeTab === 'notifications' && (
            <NotificationsTab
              carrierId={carrier?.id}
              notifications={initialNotifications}
            />
          )}
          {activeTab === 'verification' && (
            <VerificationTab
              carrierId={carrier?.id}
              documents={initialDocuments}
            />
          )}
          {activeTab === 'insurance' && (
            <InsuranceTab
              carrierId={carrier?.id}
              insurance={initialInsurance}
            />
          )}
          {activeTab === 'photos' && (
            <PhotosTab
              carrierId={carrier?.id}
              photos={carrier?.photos ?? []}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ── Dynamic imports for tabs (they're all client components) ──
import IdentityTab from './tabs/IdentityTab'
import ProfileTab from './tabs/ProfileTab'
import TelephoneTab from './tabs/TelephoneTab'
import CompanyTab from './tabs/CompanyTab'
import LocationTab from './tabs/LocationTab'
import NotificationsTab from './tabs/NotificationsTab'
import VerificationTab from './tabs/VerificationTab'
import InsuranceTab from './tabs/InsuranceTab'
import PhotosTab from './tabs/PhotosTab'

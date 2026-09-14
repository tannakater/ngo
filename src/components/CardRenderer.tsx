import React from 'react';
import { CardTemplate, Member, Organization } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import { Barcode } from './Barcode';
import { getOptimizeImageUrl } from '../lib/utils';
import { getMemberVerificationUrl } from '../utils/verification';
import { DEFAULT_OFFICIAL_LOGO_SVG } from '../store/useOrgStore';

interface CardRendererProps {
  template: CardTemplate;
  member: Member;
  organization: Organization;
  side: 'front' | 'back';
  scale?: number;
}

export function CardRenderer({ template, member, organization, side, scale = 1 }: CardRendererProps) {
  const pxPerMm = 3.78 * scale;
  const s = (mm: number) => mm * pxPerMm;

  // Exact 5cm (50mm) width and 8cm (80mm) height standard portrait ID card
  const actualWidth = 50;
  const actualHeight = 80;

  const bgStyle = {
    width: `${s(actualWidth)}px`,
    height: `${s(actualHeight)}px`,
    borderRadius: `${s(3)}px`,
    overflow: 'hidden',
    position: 'relative' as const,
    boxShadow: `0 4px 14px rgba(0,0,0,0.12)`,
    border: `1px solid rgba(0,0,0,0.08)`,
    fontFamily: '"Inter", "Hind Siliguri", sans-serif',
    flexShrink: 0,
    backgroundColor: '#FFFFFF',
  };

  const primaryColor = template.primaryColor || '#059669';
  const secondaryColor = template.secondaryColor || '#047857';

  // Fallbacks
  const memberId = member.memberId || 'ID-1234567';
  const phone = member.phone || '';
  const nid = member.nid || member.customFields?.nid || member.customFields?.NID || '';
  const bloodGroup = member.bloodGroup || member.customFields?.bloodGroup || '';
  const department = member.department || '';
  
  const village = member.village || member.customFields?.village || member.address || '';
  const postOffice = member.postOffice || member.customFields?.postOffice || '';
  const thana = member.thana || member.customFields?.thana || '';
  const district = member.district || member.customFields?.district || '';

  // Reliable, high-resolution official logo
  const effectiveLogo = (organization.logoUrl && !organization.logoUrl.includes('photo-1582213782179-e0d53f98f2ca'))
    ? organization.logoUrl
    : DEFAULT_OFFICIAL_LOGO_SVG;

  const orgName = organization.name || 'Global Hope Foundation';
  const isVolunteer = member.role === 'Volunteer';
  const isStaff = member.role === 'Staff';

  if (side === 'front') {
    return (
      <div style={bgStyle}>
        {/* Top Gold Security Strip */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: `${s(0.9)}px`,
          background: 'linear-gradient(90deg, #d97706, #f59e0b, #fbbf24, #f59e0b, #d97706)',
          zIndex: 5,
        }}></div>

        {/* Front Top Header Background */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: `${s(20)}px`,
          background: `linear-gradient(135deg, ${secondaryColor} 0%, ${primaryColor} 100%)`,
          zIndex: 1,
          boxShadow: `0 ${s(1)}px ${s(3)}px rgba(0,0,0,0.15)`,
        }}>
          {/* Subtle Guilloche / Wave decorative background overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.12,
            backgroundImage: 'radial-gradient(circle at 50% 0, #ffffff 15%, transparent 16%)',
            backgroundSize: `${s(3)}px ${s(3)}px`,
          }}></div>
        </div>

        {/* Organization Official Logo Medallion */}
        <div style={{ 
          position: 'absolute', 
          top: `${s(1.6)}px`, 
          left: `${s((actualWidth - 11.5) / 2)}px`, 
          zIndex: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            width: `${s(11.5)}px`,
            height: `${s(11.5)}px`,
            backgroundColor: '#FFFFFF',
            borderRadius: '50%',
            padding: `${s(0.5)}px`,
            boxShadow: `0 ${s(0.8)}px ${s(3)}px rgba(0,0,0,0.22)`,
            border: `${s(0.35)}px solid #FCD34D`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}>
            <img 
              src={getOptimizeImageUrl(effectiveLogo)} 
              crossOrigin="anonymous" 
              referrerPolicy="no-referrer" 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain',
                display: 'block',
              }} 
              alt="Organization Logo" 
              onError={(e) => {
                // Fallback to default SVG if custom URL breaks
                (e.target as HTMLImageElement).src = DEFAULT_OFFICIAL_LOGO_SVG;
              }}
            />
          </div>
        </div>

        {/* Organization Name */}
        <div style={{ 
          position: 'absolute', 
          top: `${s(13.5)}px`, 
          left: 0, 
          right: 0, 
          textAlign: 'center', 
          zIndex: 10, 
          padding: `0 ${s(2)}px` 
        }}>
          <h1 style={{ 
            fontSize: `${s(2.25)}px`, 
            fontWeight: 800, 
            color: '#FFFFFF', 
            margin: 0, 
            lineHeight: 1.15, 
            textShadow: '0 1px 2px rgba(0,0,0,0.35)',
            letterSpacing: '0.15px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {orgName}
          </h1>
          <div style={{
            display: 'inline-block',
            marginTop: `${s(0.3)}px`,
            padding: `${s(0.15)}px ${s(2)}px`,
            backgroundColor: 'rgba(255,255,255,0.2)',
            border: `${s(0.2)}px solid rgba(255,255,255,0.4)`,
            borderRadius: `${s(10)}px`,
            fontSize: `${s(1.05)}px`,
            fontWeight: 700,
            color: '#FFFFFF',
            letterSpacing: '0.4px',
            textTransform: 'uppercase',
          }}>
            Official Credential Pass
          </div>
        </div>

        {/* Profile Photo - Properly centered & passport framed */}
        <div style={{
          position: 'absolute',
          left: `${s((actualWidth - 21) / 2)}px`,
          top: `${s(18.5)}px`,
          width: `${s(21)}px`,
          height: `${s(26.25)}px`,
          borderRadius: `${s(2)}px`,
          backgroundColor: '#f8fafc',
          zIndex: 10,
          boxShadow: `0 ${s(1.5)}px ${s(6)}px rgba(0,0,0,0.18)`,
          border: `${s(1.4)}px solid #FFFFFF`,
          outline: `${s(0.35)}px solid rgba(5,150,105,0.35)`,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {member.photoUrl ? (
            <img 
              src={getOptimizeImageUrl(member.photoUrl)} 
              crossOrigin="anonymous" 
              referrerPolicy="no-referrer" 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',
                objectPosition: 'center', // Rely on center crop, preventing unnatural forehead cutting
                display: 'block' 
              }} 
              alt={`${member.firstName} Photo`} 
              onError={(e) => {
                // Fallback to stylized silhouette avatar
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div style={{ 
              width: '100%', 
              height: '100%', 
              background: 'linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: '#64748b' 
            }}>
              <div style={{ 
                width: `${s(7.5)}px`, 
                height: `${s(7.5)}px`, 
                borderRadius: '50%', 
                backgroundColor: '#cbd5e1', 
                marginBottom: `${s(0.6)}px`,
                border: `${s(0.3)}px solid #94a3b8` 
              }} />
              <div style={{
                width: `${s(14)}px`,
                height: `${s(5.5)}px`,
                borderRadius: `${s(3)}px ${s(3)}px 0 0`,
                backgroundColor: '#cbd5e1',
              }} />
              <span style={{ fontSize: `${s(1.3)}px`, fontWeight: 700, color: '#94a3b8', marginTop: `${s(0.5)}px`, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Photo</span>
            </div>
          )}

          {/* Miniature Official Verification Badge tick */}
          <div style={{
            position: 'absolute',
            bottom: `${s(0.8)}px`,
            right: `${s(0.8)}px`,
            width: `${s(4)}px`,
            height: `${s(4)}px`,
            borderRadius: '50%',
            backgroundColor: '#059669',
            border: `${s(0.35)}px solid #FFFFFF`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
          }}>
            <svg viewBox="0 0 12 12" style={{ width: `${s(2.5)}px`, height: `${s(2.5)}px`, fill: '#FFFFFF' }}>
              <path d="M9.5 3.5L4.5 8.5L2.5 6.5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
        </div>

        {/* Member Name and Designation */}
        <div style={{ 
          position: 'absolute', 
          top: `${s(46.8)}px`, 
          left: 0, 
          right: 0, 
          textAlign: 'center', 
          zIndex: 10, 
          padding: `0 ${s(2)}px` 
        }}>
          <div style={{ 
            fontSize: `${s(3.4)}px`, 
            fontWeight: 800, 
            color: '#0f172a', 
            lineHeight: 1.15, 
            letterSpacing: '0.1px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {member.firstName} {member.lastName}
          </div>
          
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            marginTop: `${s(0.5)}px`,
            padding: `${s(0.5)}px ${s(2.5)}px`,
            backgroundColor: isVolunteer ? '#ecfdf5' : isStaff ? '#eff6ff' : '#f8fafc',
            border: `${s(0.3)}px solid ${isVolunteer ? '#a7f3d0' : isStaff ? '#bfdbfe' : '#e2e8f0'}`,
            borderRadius: `${s(10)}px`,
          }}>
            <span style={{ 
              fontSize: `${s(1.8)}px`, 
              fontWeight: 800, 
              color: isVolunteer ? '#047857' : isStaff ? '#1d4ed8' : '#334155', 
              textTransform: 'uppercase', 
              letterSpacing: '0.4px',
              lineHeight: 1.2
            }}>
              {member.designation || member.role || 'Volunteer'}
            </span>
          </div>
        </div>

        {/* Info Table */}
        <div style={{ 
          position: 'absolute', 
          top: `${s(58.5)}px`, 
          left: `${s(3.5)}px`, 
          right: `${s(3.5)}px`, 
          zIndex: 10,
          backgroundColor: '#f8fafc',
          borderRadius: `${s(1.6)}px`,
          padding: `${s(1)}px ${s(1.5)}px`,
          border: `${s(0.25)}px solid #e2e8f0`,
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: `${s(1.8)}px`, color: '#334155' }}>
            <tbody>
              {memberId && (
                <tr>
                  <td style={{ fontWeight: 700, padding: `${s(0.35)}px 0`, color: '#64748b', width: '30%' }}>ID No</td>
                  <td style={{ fontWeight: 700, color: '#94a3b8', width: '6%' }}>:</td>
                  <td style={{ fontWeight: 800, color: '#0f172a', fontFamily: 'monospace', fontSize: `${s(2.1)}px` }}>{memberId}</td>
                </tr>
              )}
              {bloodGroup && (
                <tr>
                  <td style={{ fontWeight: 700, padding: `${s(0.35)}px 0`, color: '#64748b' }}>Blood</td>
                  <td style={{ fontWeight: 700, color: '#94a3b8' }}>:</td>
                  <td style={{ fontWeight: 800, color: '#dc2626' }}>{bloodGroup}</td>
                </tr>
              )}
              {phone && (
                <tr>
                  <td style={{ fontWeight: 700, padding: `${s(0.35)}px 0`, color: '#64748b' }}>Phone</td>
                  <td style={{ fontWeight: 700, color: '#94a3b8' }}>:</td>
                  <td style={{ fontWeight: 700, color: '#1e293b' }}>{phone}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Accent Ribbon */}
        <div style={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          height: `${s(2.4)}px`, 
          background: `linear-gradient(90deg, ${secondaryColor}, ${primaryColor})`, 
          zIndex: 10,
          borderTop: `${s(0.35)}px solid #FCD34D`,
        }}></div>
      </div>
    );
  } else {
    // BACK OF ID CARD
    const qrSize = 16;
    return (
      <div style={bgStyle}>
        {/* Back Header Strip with Organization Logo & Name */}
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          height: `${s(5.5)}px`, 
          background: `linear-gradient(135deg, ${secondaryColor}, ${primaryColor})`, 
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          padding: `0 ${s(2)}px`,
          gap: `${s(1.2)}px`,
        }}>
          {/* Back Logo */}
          <div style={{
            width: `${s(4.5)}px`,
            height: `${s(4.5)}px`,
            backgroundColor: '#FFFFFF',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            border: `${s(0.2)}px solid #FCD34D`,
            flexShrink: 0,
          }}>
            <img 
              src={getOptimizeImageUrl(effectiveLogo)} 
              crossOrigin="anonymous" 
              referrerPolicy="no-referrer" 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
              alt="Logo"
              onError={(e) => {
                (e.target as HTMLImageElement).src = DEFAULT_OFFICIAL_LOGO_SVG;
              }}
            />
          </div>
          <div style={{
            color: '#FFFFFF',
            fontSize: `${s(1.7)}px`,
            fontWeight: 800,
            letterSpacing: '0.2px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {orgName}
          </div>
        </div>

        {/* Content Container */}
        <div style={{ position: 'absolute', top: `${s(8)}px`, left: `${s(4)}px`, right: `${s(4)}px`, zIndex: 10 }}>
          
          {/* Barcode Area on Back */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: `${s(3)}px` }}>
            <Barcode value={memberId} width={1.4} height={s(7)} fontSize={s(3.5)} margin={0} displayValue={true} background="transparent" lineColor="#0f172a" />
          </div>
          
          <div style={{ borderBottom: `1px solid ${primaryColor}`, paddingBottom: `${s(0.5)}px`, marginBottom: `${s(1.5)}px` }}>
            <h3 style={{ fontSize: `${s(2.4)}px`, fontWeight: 800, color: '#1E293B', margin: 0 }}>Official Contact / Return Address</h3>
          </div>
          <div style={{ fontSize: `${s(2)}px`, color: '#475569', lineHeight: 1.6, fontWeight: 500, marginBottom: `${s(1.5)}px` }}>
            <div style={{ fontWeight: 800, color: '#1E293B', marginBottom: `${s(0.5)}px` }}>If found, please return to:</div>
            {organization.name && <div style={{ fontWeight: 700 }}>{organization.name}</div>}
            {organization.address && <div>{organization.address}</div>}
            {organization.phone && <div>📞 {organization.phone}</div>}
            {organization.email && <div>✉️ {organization.email}</div>}
          </div>
        </div>

        {/* QR Code Container with Verification Label - Centered mathematically */}
        <div style={{ 
          position: 'absolute', 
          bottom: `${s(6.5)}px`, 
          left: `${s((actualWidth - qrSize) / 2)}px`, 
          width: `${s(qrSize)}px`,
          height: `${s(qrSize)}px`,
          backgroundColor: '#FFFFFF', 
          padding: `${s(0.8)}px`, 
          borderRadius: `${s(1.5)}px`, 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center', 
          zIndex: 10, 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
          border: '1px solid #cbd5e1' 
        }}>
          <QRCodeSVG 
            value={getMemberVerificationUrl(member, organization)} 
            size={s(qrSize - 1.6)} 
            level="M"
            fgColor="#0f172a" 
          />
        </div>

        {/* Mini Scan label */}
        <div style={{
          position: 'absolute',
          bottom: `${s(3.5)}px`,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: `${s(1.3)}px`,
          fontWeight: 700,
          color: '#64748b',
          letterSpacing: '0.4px',
          textTransform: 'uppercase',
          zIndex: 10,
        }}>
          Scan to Verify Authenticity
        </div>

        {/* Footer Notice */}
        <div style={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          background: primaryColor, 
          color: '#FFFFFF', 
          padding: `${s(0.8)}px ${s(2)}px`, 
          fontSize: `${s(1.05)}px`, 
          fontWeight: 600, 
          textAlign: 'center', 
          lineHeight: 1.2, 
          zIndex: 10,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          borderTop: `${s(0.3)}px solid #FCD34D`,
        }}>
          {(organization.noticeText && !/[\u0980-\u09FF]/.test(organization.noticeText)) 
            ? organization.noticeText 
            : 'If found, please return this card to the central office.'}
        </div>
      </div>
    );
  }
}

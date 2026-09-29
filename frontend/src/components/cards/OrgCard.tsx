import type {Org as Organization, OrgTag } from '../../api/organizations';
import { type ColorVariantClasses, classesForID, colorKey } from '../../utils/palette';
import { orgInitials } from '../../utils/stringcheck';
import Tag from '../_chips/Tag';

type OrgCardProps = {
  org: Organization,
  onClick: () => void,
  idx: number,
}

/** Current design doesn't use organization tags, so this is a placeholder method for styling them/indexing their color */
function makeOrgTagChip(k: string, tag: OrgTag) {
  const idx = tag.charCodeAt(0)+tag.charCodeAt(1);
  return <Tag key={k} variant={colorKey(idx)}>{tag}</Tag>
}

export default function OrgCard({ org, onClick, idx }: OrgCardProps) {
  const color: ColorVariantClasses = classesForID(org.id);
  const inits = orgInitials(org.name);
  return (
    <div
      onClick={onClick}
      className="cf-card-hover bg-white border border-gray-200 rounded-lg p-5 cursor-pointer flex gap-4 items-start"
      style={{ animation: `cf-stagger .35s ease ${idx * 0.04}s both` }}
    >
      <span className={`w-0.75 self-stretch shrink-0 ${color.railY}`} />
      {/* Logo plate: org initials until a real logo is supplied. */}
      <div
        className={`rounded-md size-15 shrink-0 flex items-center justify-center text-base font-bold ${color.plate}`}
      >
        {inits}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex gap-2 flex-wrap mb-2.5">
          {(org.tags ?? []).map((t, i) => makeOrgTagChip(`${inits}-${i}`,t))}
        </div>
        <h3 className="font-sans text-lg font-bold text-gray-900 mb-1 leading-tight">{org.name}</h3>
        <p className="text-sm text-gray-500 leading-relaxed">{org.blurb}</p>
      </div>
    </div>
  );
}
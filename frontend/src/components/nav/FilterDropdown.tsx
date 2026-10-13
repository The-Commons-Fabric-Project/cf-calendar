/**
 * FilterDropdown component - currently used to filter calendar events by organization, written so that a dropdown menu of filters could be repurposed for another data type
 */

import { useState } from "react";

import { classesForID, colorKey } from "../../utils/palette";
import Button from "../_controls/Button";
import type { Org } from "../../api/organizations";

interface FilterDropdownProps {
  /** all organizations with events to display */
  orgs: Org[];
  /** IDs of options (organizations) to view */
  appliedIds: number[];
  /** callback to update changes in checked options */
  onApply: (ids: number[]) => void;
}

export default function FilterDropdown({ orgs, appliedIds, onApply }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<number[]>(orgs ? orgs.map(o=>o.id) : []);

  const dirty: boolean = [...pending].sort().join() !== [...appliedIds].sort().join();
  const allSelected = appliedIds.length === orgs.length;

  const toggle = () => {
    if (!open) setPending(appliedIds);
    setOpen(!open);
  }


  return (
    <div className="relative">
      <Button 
        label="filter dropdown"
        variant="secondary" onClick={toggle} 
        className={`text-ink border-${open ? "ink" : "line"} inline-flex items-center gap-2`}
      >
        <span className={"h-1 w-3 rounded-xs"}
        style = {{background: appliedIds.length !== 0 ? `linear-gradient(90deg,${appliedIds.sort().map(i=>`var(--color-${colorKey(i-1)}-c1)`)})`: "var(--color-purple-c1)"}}/>
        {allSelected ? "All organizations" : `${appliedIds.length} of ${orgs.length} orgs`}
        <span className="text-muted text-[9px]">
          {open ? "▲" : "▼"}
        </span>
      </Button>

      {open && (
        <div className="z-20 absolute right-0 inset-bs-[calc(100%+6px)] w-66 border border-ink bg-surface rounded-lg p-3.5">
          <div className="flex items-center justify-between gap-2.5 mb-2.5">
            <span>FILTER BY ORG</span>
            <button
              className="bg-none border-none text-[10.5px] font-bold text-body underline p-0"
              onClick={()=> setPending(orgs.map(o => o.id))}
            >All</button>
          </div>
          <div className="flex flex-col gap-0.5 mb-3 max-h-57.5 overflow-y-auto">
            {orgs.map((o) => {
              const pal = classesForID(o.id);
              const checked = pending.includes(o.id);

              return (
                <label key={o.id} className="flex items-start gap-2.25 px-1.5 py-1 rounded-sm cursor-pointer">
                  <input type="checkbox" checked={checked}
                    onChange={() => {
                      console.log("checkbox event");
                      setPending(checked ? pending.filter(x => x !== o.id) : [...pending, o.id]);
                    }}
                    className="pointer mt-px w-3.25 h-3.25 shrink-0 accent-accent"
                  ></input>
                  <span className={`h-1 w-3 rounded-xs shrink-0 mt-1.25 ${pal.railX}`}></span>
                  <span className="text-ink text-xs">{o.name}</span>
                </label>
              )
            })}
          </div>
          
          <Button variant={dirty ? "primary" : "disabled"} onClick={() => {
            onApply(pending);
            setOpen(false);
          }}>Apply</Button>

          <p className="text-xs text-muted mt-2.25">{allSelected
              ? "Showing all organizations."
              : `Showing ${appliedIds.length} of ${orgs.length} organizations.`}</p>
        </div>
      )}
    </div>
  )
}
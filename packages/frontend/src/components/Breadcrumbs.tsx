import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface Props {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: Props) {
  return (
    <nav aria-label="breadcrumb" className="mb-4 flex items-center gap-1.5 text-sm text-slate-500">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden>/</span>}
            {item.to && !isLast ? (
              <Link to={item.to} className="hover:text-brand">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'text-slate-800 font-medium' : ''}>{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

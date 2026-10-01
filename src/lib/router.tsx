import {
  Link as RouterLink,
  useLocation,
  type LinkProps as RouterLinkProps,
} from "react-router-dom";

type LinkProps = Omit<RouterLinkProps, "to"> & {
  href: string;
};

export function Link({ href, ...props }: LinkProps) {
  return <RouterLink to={href} {...props} />;
}

export function usePathname() {
  return useLocation().pathname;
}

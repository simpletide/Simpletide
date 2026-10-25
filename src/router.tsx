import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    // Restore scroll everywhere except the products listing. The shop page
    // manages its own scroll (always top on mount / page change) so the
    // browser Back button never drops you at the footer.
    scrollRestoration: ({ location }) => location.pathname !== "/products",
    defaultPreloadStaleTime: 0,
  });

  return router;
};

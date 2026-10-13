const PATH_KEY = "fragments-of-elsewhere:path";
const PENDING_KEY =
  "fragments-of-elsewhere:pending-keyword";

function normalizePath(path) {
  return path.endsWith("/") ? path : `${path}/`;
}

export function getPath() {
  try {
    const savedPath =
      window.localStorage.getItem(PATH_KEY);

    if (!savedPath) return [];

    const parsedPath = JSON.parse(savedPath);

    return Array.isArray(parsedPath)
      ? parsedPath
      : [];
  } catch (error) {
    console.error(
      "Could not read browsing path:",
      error
    );

    return [];
  }
}

export function rememberFollow(keyword, href) {
  try {
    const target = normalizePath(
      new URL(
        href,
        window.location.origin
      ).pathname
    );

    window.localStorage.setItem(
      PENDING_KEY,
      JSON.stringify({
        keyword,
        target
      })
    );
  } catch (error) {
    console.error(
      "Could not remember clicked keyword:",
      error
    );
  }
}

export function recordFragment(fragment) {
  try {
    if (!fragment?.id || !fragment?.type) {
      console.error(
        "Invalid fragment passed to PathTracker:",
        fragment
      );

      return;
    }

    const path = getPath();

    const currentPath = normalizePath(
      window.location.pathname
    );

    const item = {
      id: fragment.id,
      type: fragment.type,
      href: currentPath,
      image: fragment.image ?? null,
      alt: fragment.alt ?? "",
      keyword:
        fragment.title ??
        fragment.id
    };

    const pendingData =
      window.localStorage.getItem(
        PENDING_KEY
      );

    if (pendingData) {
      try {
        const pending = JSON.parse(
          pendingData
        );

        if (
          fragment.type === "text" &&
          pending?.target === currentPath &&
          pending?.keyword
        ) {
          item.keyword = pending.keyword;
        }
      } catch (error) {
        console.error(
          "Could not read pending keyword:",
          error
        );
      }

      window.localStorage.removeItem(
        PENDING_KEY
      );
    }

    const previousItem =
      path[path.length - 1];

    // 刷新当前页面时不重复记录
    if (
      previousItem?.href === item.href
    ) {
      return;
    }

    path.push(item);

    window.localStorage.setItem(
      PATH_KEY,
      JSON.stringify(path.slice(-200))
    );
  } catch (error) {
    console.error(
      "Could not record fragment:",
      error
    );
  }
}

export function resetPath() {
  window.localStorage.removeItem(PATH_KEY);
  window.localStorage.removeItem(
    PENDING_KEY
  );
}
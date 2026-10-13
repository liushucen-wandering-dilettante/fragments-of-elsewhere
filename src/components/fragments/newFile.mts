// 中英文切换
document
  .querySelectorAll<HTMLElement>("[data-text-fragment]")
  .forEach((page) => {
    const languageButton = page.querySelector<HTMLButtonElement>(
      "[data-language-toggle]"
    );
    const languagePanels = page.querySelectorAll<HTMLElement>(
      "[data-language-panel]"
    );

    if (!(languageButton instanceof HTMLButtonElement)) {
      return;
    }

    const safeLanguageButton: HTMLButtonElement = languageButton;

    function showLanguage(language: "zh" | "en") {
      // 切换正文语言
      languagePanels.forEach((panel) => {
        panel.hidden = panel.dataset.languagePanel !== language;
      });

      // 切换 follow 菜单的语言
      const followLabels = page.querySelectorAll<HTMLElement>(
        "[data-follow-language]"
      );
      followLabels.forEach((label) => {
        label.hidden = label.dataset.followLanguage !== language;
      });

      // 更新 PathTracker 将要记录的关键词
      const followLinks = page.querySelectorAll<HTMLAnchorElement>(
        ".follow-options a[data-path-label]"
      );
      followLinks.forEach((link) => {
        const chineseLabel =
          link.dataset.pathLabelZh ?? link.dataset.pathLabel ?? "";
        const englishLabel = link.dataset.pathLabelEn ?? chineseLabel;
        link.dataset.pathLabel =
          language === "zh" ? chineseLabel : englishLabel;
      });

      page.dataset.language = language;
      safeLanguageButton.textContent = language === "zh" ? "EN" : "中";
      safeLanguageButton.setAttribute(
        "aria-label",
        language === "zh" ? "Switch to English" : "切换到中文"
      );
    }

    safeLanguageButton.addEventListener("click", () => {
      const currentLanguage = page.dataset.language === "en" ? "en" : "zh";
      showLanguage(currentLanguage === "zh" ? "en" : "zh");
    });

    showLanguage(page.dataset.language === "en" ? "en" : "zh");
  });

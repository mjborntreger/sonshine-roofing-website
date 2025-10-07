"use client";

import { useEffect } from "react";

export default function FaqBulkToggleClient() {
  useEffect(() => {
    const toggleBtn = document.getElementById("faq-toggle-all");
    if (!(toggleBtn instanceof HTMLButtonElement)) return;

    const label = toggleBtn.querySelector<HTMLElement>("[data-faq-toggle-label]");
    const iconDown = toggleBtn.querySelector<HTMLElement>("[data-faq-toggle-icon=\"down\"]");
    const iconUp = toggleBtn.querySelector<HTMLElement>("[data-faq-toggle-icon=\"up\"]");

    const $all = <T extends Element>(selector: string, ctx?: ParentNode | Element | Document | null): T[] => {
      const scope = ctx ?? document;
      return scope ? Array.from(scope.querySelectorAll<T>(selector)) : [];
    };

    const isVisible = (node: Element) => {
      if (!(node instanceof HTMLElement)) return true;
      if (node.hidden) return false;
      if (node.classList.contains("hidden")) return false;
      if (node.style && node.style.display === "none") return false;
      return true;
    };

    const updateButton = () => {
      const topicNodes = $all<HTMLDetailsElement>("details.faq-topic");
      const visibleTopics = topicNodes.filter(isVisible);
      const hasTopics = visibleTopics.length > 0;
      const allOpen = hasTopics && visibleTopics.every((node) => node.open);

      toggleBtn.dataset.state = allOpen ? "expanded" : "collapsed";
      toggleBtn.setAttribute("aria-expanded", allOpen ? "true" : "false");

      if (label) label.textContent = allOpen ? "Collapse all" : "Expand all";
      if (iconDown) iconDown.classList.toggle("hidden", allOpen);
      if (iconUp) iconUp.classList.toggle("hidden", !allOpen);
    };

    const setAll = (open: boolean) => {
      $all<HTMLDetailsElement>("details.faq-topic").forEach((node) => {
        node.open = open;
      });
    };

    const ensureListeners = () => {
      $all<HTMLDetailsElement>("details.faq-topic").forEach((node) => {
        if (node.dataset.bulkToggleBound === "1") return;
        node.addEventListener("toggle", updateButton);
        node.dataset.bulkToggleBound = "1";
      });
    };

    const handleClick = () => {
      const next = toggleBtn.dataset.state !== "expanded";
      setAll(next);
      updateButton();
    };

    toggleBtn.addEventListener("click", handleClick);

    ensureListeners();
    updateButton();

    const topicsRoot = document.getElementById("faq-topics");
    const observer = topicsRoot
      ? new MutationObserver(() => {
          ensureListeners();
          updateButton();
        })
      : null;

    if (observer && topicsRoot) {
      observer.observe(topicsRoot, { childList: true, subtree: true });
    }

    const handleExternalUpdate = () => {
      ensureListeners();
      updateButton();
    };

    window.addEventListener("faq:update", handleExternalUpdate);

    return () => {
      toggleBtn.removeEventListener("click", handleClick);
      window.removeEventListener("faq:update", handleExternalUpdate);
      observer?.disconnect();
      $all<HTMLDetailsElement>("details.faq-topic").forEach((node) => {
        if (node.dataset.bulkToggleBound === "1") {
          node.removeEventListener("toggle", updateButton);
          delete node.dataset.bulkToggleBound;
        }
      });
    };
  }, []);

  return null;
}

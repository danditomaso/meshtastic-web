import { type LangCode, supportedLanguages } from "@app/i18n-config.ts";
import useLang from "@core/hooks/useLang.ts";
import { cn } from "@core/utils/cn.ts";
import { Check, Languages } from "lucide-react";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "./UI/Button.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./UI/DropdownMenu.tsx";
import { P } from "./UI/Typography/P.tsx";

interface LanguageSwitcherProps {
  disableHover?: boolean;
}

export default function LanguageSwitcher({
  disableHover = false,
}: LanguageSwitcherProps) {
  const { i18n } = useTranslation("ui");
  const { set: setLanguage, currentLanguage } = useLang();

  const handleLanguageChange = useCallback(
    async (languageCode: LangCode) => {
      await setLanguage(languageCode, true);
    },
    [setLanguage],
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "group flex items-center justify-start",
            "transition-colors duration-150 gap-2.5 p-1.5 rounded-md",
          )}
        >
          <Languages
            size={16}
            className={cn(
              "flex w-4 flex-shrink-0 transition-colors duration-150",
            )}
          />
          <p className={cn("text-sm transition-colors duration-150")}>
            {`${i18n.t("language.changeLanguage")}:`}
          </p>
          <p
            className={cn(
              "text-sm font-medium  transition-colors duration-150",
            )}
          >
            {currentLanguage?.name}
          </p>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-48">
        {supportedLanguages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span>{language.flag}</span>
              <span>{language.name}</span>
            </div>
            {i18n.language === language.code && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

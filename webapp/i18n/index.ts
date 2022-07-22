import * as en from './en.json';

export function getTranslations(locale: string): {[key: string]: string} {
    switch (locale) {
    case 'en':
        return en;
    }
    return {};
}

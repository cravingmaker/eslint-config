import type { Linter } from 'eslint';

type ReactRefreshVariant = 'generic' | 'next' | 'vite';

const nextAllowExportNames = [
	'config',
	'dynamic',
	'dynamicParams',
	'fetchCache',
	'generateImageMetadata',
	'generateMetadata',
	'generateSitemaps',
	'generateStaticParams',
	'generateViewport',
	'maxDuration',
	'metadata',
	'revalidate',
	'runtime',
	'size',
] as const;

const emptyAllowExportNames: string[] = [];

const variantOptionsMap = {
	generic: { allowConstantExport: false, allowExportNames: emptyAllowExportNames, checkJS: false },
	next: { allowConstantExport: false, allowExportNames: [...nextAllowExportNames], checkJS: false },
	vite: { allowConstantExport: true, allowExportNames: emptyAllowExportNames, checkJS: false },
} as const;

function getReactRefreshEslintRules(variant: ReactRefreshVariant): Linter.RulesRecord {
	// eslint-disable-next-line security/detect-object-injection -- variant is a string-literal union; not user-controlled input
	const variantOptions = variantOptionsMap[variant];
	return {
		'react-refresh/only-export-components': ['warn', { ...variantOptions }],
	} as const;
}

export { getReactRefreshEslintRules };
export type { ReactRefreshVariant };

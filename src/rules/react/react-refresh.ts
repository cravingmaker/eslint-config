import type { Linter } from 'eslint';

type ReactRefreshVariant = 'generic' | 'next' | 'vite';

function getReactRefreshEslintRules(variant: ReactRefreshVariant): Linter.RulesRecord {
	const variantOptionsMap = {
		generic: { allowConstantExport: false, allowExportNames: [], checkJS: false },
		next: {
			allowConstantExport: false,
			allowExportNames: [
				// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config
				'dynamic',
				'dynamicParams',
				'experimental_ppr',
				'fetchCache',
				'maxDuration',
				'preferredRegion',
				'revalidate',
				'runtime',

				// https://nextjs.org/docs/app/api-reference/functions/generate-metadata
				'generateMetadata',
				'metadata',

				// https://nextjs.org/docs/app/api-reference/functions/generate-viewport
				'generateViewport',
				'viewport',

				// https://nextjs.org/docs/app/api-reference/functions/generate-image-metadata
				'generateImageMetadata',

				// https://nextjs.org/docs/app/api-reference/functions/generate-sitemaps
				'generateSitemaps',

				// https://nextjs.org/docs/app/api-reference/functions/generate-static-params
				'generateStaticParams',
			],
			checkJS: false,
		},
		vite: { allowConstantExport: true, allowExportNames: [], checkJS: false },
	} as const;

	// eslint-disable-next-line security/detect-object-injection -- variant is a string-literal union; not user-controlled input
	const variantOptions = variantOptionsMap[variant];

	return {
		'react-refresh/only-export-components': ['warn', { ...variantOptions }],
	} as const;
}

export type { ReactRefreshVariant };
export { getReactRefreshEslintRules };

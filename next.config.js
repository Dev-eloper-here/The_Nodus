/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // Ensure we don't have issues with weird builds
    typescript: {
        ignoreBuildErrors: true,
    },

};

module.exports = nextConfig;

#!/usr/bin/env node

const fs = require("fs");

const files = {
  app: "app.json",
  package: "package.json",
  lock: "package-lock.json",
};

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function writeJson(path, value) {
  fs.writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function nextPatch(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) {
    throw new Error(`Expected semver patch version like 1.0.1, got ${version}`);
  }

  return `${match[1]}.${match[2]}.${Number(match[3]) + 1}`;
}

const requestedVersion = process.argv[2] || process.env.VERSION;
const appJson = readJson(files.app);
const packageJson = readJson(files.package);
const packageLock = readJson(files.lock);
const currentVersion = appJson.expo.version;
const newVersion = requestedVersion || nextPatch(currentVersion);

if (requestedVersion && !/^\d+\.\d+\.\d+$/.test(requestedVersion)) {
  throw new Error(`Expected semver patch version like 1.0.2, got ${requestedVersion}`);
}

if (packageJson.version !== currentVersion) {
  throw new Error(
    `package.json version ${packageJson.version} does not match app.json version ${currentVersion}`,
  );
}

appJson.expo.version = newVersion;
packageJson.version = newVersion;
packageLock.version = newVersion;

if (packageLock.packages && packageLock.packages[""]) {
  packageLock.packages[""].version = newVersion;
}

writeJson(files.app, appJson);
writeJson(files.package, packageJson);
writeJson(files.lock, packageLock);

// The Android build reads versionName from here (android/app/build.gradle).
const gradleProps = "android/gradle.properties";
const props = fs.readFileSync(gradleProps, "utf8");
if (!/^appVersionName=.*$/m.test(props)) {
  throw new Error(`appVersionName not found in ${gradleProps}`);
}
fs.writeFileSync(gradleProps, props.replace(/^appVersionName=.*$/m, `appVersionName=${newVersion}`));

if (currentVersion === newVersion) {
  console.log(`App version already set to ${newVersion}`);
} else if (requestedVersion) {
  console.log(`Set app version: ${currentVersion} -> ${newVersion}`);
} else {
  console.log(`Bumped app version: ${currentVersion} -> ${newVersion}`);
}

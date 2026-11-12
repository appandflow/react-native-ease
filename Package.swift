// swift-tools-version: 6.0

import Foundation
import PackageDescription

// React Native resolves this package through build/generated/autolinking/libs/Ease.
let usedRootEntries: Set<String> = ["ios", "spm-headers", "Package.swift"]
let unusedRootEntries = try! FileManager.default.contentsOfDirectory(atPath: Context.packageDirectory)
    .filter { !usedRootEntries.contains($0) }
    .sorted()
let iosProjects = try! FileManager.default.contentsOfDirectory(
    atPath: Context.packageDirectory + "/ios"
).filter { $0.hasSuffix(".xcodeproj") }.map { "ios/" + $0 }

let package = Package(
    name: "Ease",
    platforms: [.iOS("15.1")],
    products: [
        .library(name: "Ease", targets: ["Ease"]),
    ],
    dependencies: [
        .package(name: "ReactNative", path: "../../../../xcframeworks"),
        .package(name: "React-GeneratedCode", path: "../../../ios"),
    ],
    targets: [
        .target(
            name: "Ease",
            dependencies: [
                .product(name: "ReactHeaders", package: "ReactNative"),
                .product(name: "ReactNativeHeaders", package: "ReactNative"),
                .product(name: "ReactNativeDependenciesHeaders", package: "ReactNative"),
                .product(name: "ReactAppHeaders", package: "React-GeneratedCode"),
            ],
            path: ".",
            exclude: unusedRootEntries + iosProjects,
            sources: ["ios"],
            publicHeadersPath: "ios",
            cSettings: [
                .define("RCT_NEW_ARCH_ENABLED", to: "1"),
                .headerSearchPath("spm-headers"),
            ],
            cxxSettings: [
                .define("RCT_NEW_ARCH_ENABLED", to: "1"),
                .headerSearchPath("spm-headers"),
                .define("DEBUG", .when(configuration: .debug)),
                .define("NDEBUG", .when(configuration: .release)),
            ],
            linkerSettings: [
                .linkedFramework("UIKit"),
                .linkedFramework("Foundation"),
                .linkedFramework("CoreGraphics"),
            ]
        ),
    ],
    cxxLanguageStandard: .cxx20
)

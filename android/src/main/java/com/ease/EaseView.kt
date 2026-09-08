package com.ease

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.animation.ObjectAnimator
import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Color
import android.graphics.Outline
import android.view.View
import android.view.ViewOutlineProvider
import android.view.animation.PathInterpolator
import androidx.dynamicanimation.animation.DynamicAnimation
import androidx.dynamicanimation.animation.SpringAnimation
import androidx.dynamicanimation.animation.SpringForce
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.BackgroundStyleApplicator
import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.LengthPercentageType
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.style.BorderRadiusProp
import com.facebook.react.uimanager.style.LogicalEdge
import com.facebook.react.views.view.ReactViewGroup
import kotlin.math.sqrt

// Matches React Native's camera distance normalization.
// https://github.com/facebook/react-native/blob/a98aa814/ReactAndroid/src/main/java/com/facebook/react/uimanager/BaseViewManager.java#L58
private val CAMERA_DISTANCE_NORMALIZATION_MULTIPLIER = sqrt(5.0).toFloat()

class EaseView(context: Context) : ReactViewGroup(context) {

    // --- Previous animate values (for change detection) ---
    private var prevOpacity: Float? = null
    private var prevTranslateX: Float? = null
    private var prevTranslateY: Float? = null
    private var prevScaleX: Float? = null
    private var prevScaleY: Float? = null
    private var prevRotate: Float? = null
    private var prevRotateX: Float? = null
    private var prevRotateY: Float? = null
    private var prevBorderRadius: Float? = null
    private var prevBackgroundColor: Int? = null
    private var prevBorderWidth: Float? = null
    private var prevBorderColor: Int? = null
    private var prevElevation: Float? = null
    private var currentBackgroundColor: Int = Color.TRANSPARENT
    private var currentBorderColor: Int = Color.BLACK

    // --- First mount tracking ---
    private var isFirstMount: Boolean = true

    // --- Transition configs (set by ViewManager via ReadableMap) ---
    private var transitionConfigs: Map<String, TransitionConfig> = emptyMap()

    data class TransitionConfig(
        val type: String,
        val duration: Int,
        val easingBezier: FloatArray,
        val damping: Float,
        val stiffness: Float,
        val mass: Float,
        val velocity: Float,
        val loop: String,
        val delay: Long
    )

    fun setTransitionsFromMap(map: ReadableMap?) {
        if (map == null) {
            transitionConfigs = emptyMap()
            return
        }
        val configs = mutableMapOf<String, TransitionConfig>()
        val keys = listOf("defaultConfig", "transform", "opacity", "borderRadius", "backgroundColor", "border", "shadow")
        for (key in keys) {
            if (map.hasKey(key)) {
                val configMap = map.getMap(key) ?: continue
                val bezierArray = configMap.getArray("easingBezier")!!
                configs[key] = TransitionConfig(
                    type = configMap.getString("type")!!,
                    duration = configMap.getInt("duration"),
                    easingBezier = floatArrayOf(
                        bezierArray.getDouble(0).toFloat(),
                        bezierArray.getDouble(1).toFloat(),
                        bezierArray.getDouble(2).toFloat(),
                        bezierArray.getDouble(3).toFloat()
                    ),
                    damping = configMap.getDouble("damping").toFloat(),
                    stiffness = configMap.getDouble("stiffness").toFloat(),
                    mass = configMap.getDouble("mass").toFloat(),
                    velocity = if (configMap.hasKey("velocity")) configMap.getDouble("velocity").toFloat() else 0f,
                    loop = configMap.getString("loop")!!,
                    delay = configMap.getInt("delay").toLong()
                )
            }
        }
        transitionConfigs = configs
    }

    /** Map property name to category key, then fall back to defaultConfig. */
    fun getTransitionConfig(name: String): TransitionConfig {
        val categoryKey = when (name) {
            "opacity" -> "opacity"
            "translateX", "translateY", "scaleX", "scaleY",
            "rotate", "rotateX", "rotateY" -> "transform"
            "borderRadius" -> "borderRadius"
            "backgroundColor" -> "backgroundColor"
            "borderWidth", "borderColor" -> "border"
            "elevation" -> "shadow"
            else -> null
        }
        if (categoryKey != null) {
            transitionConfigs[categoryKey]?.let { return it }
        }
        return transitionConfigs["defaultConfig"]!!
    }

    private fun allTransitionsNone(): Boolean {
        val defaultConfig = transitionConfigs["defaultConfig"]
        if (defaultConfig == null || defaultConfig.type != "none") return false
        val categories = listOf("transform", "opacity", "borderRadius", "backgroundColor", "border", "shadow")
        return categories.all { key ->
            val config = transitionConfigs[key]
            config == null || config.type == "none"
        }
    }

    // Drop every running loop the current props no longer ask for.
    //
    // The per-property paths in applyAnimateValues() only cancel an animator
    // when the property is still in animatedProperties AND its value changed.
    // Props that drop a property from `animate` entirely, or that keep
    // animating it but stop asking for `loop`, hit neither gate — the infinite
    // ValueAnimator keeps driving the view forever, even after the view is
    // reused for different content. Treat the current props as the source of
    // truth instead.
    private fun removeStaleLoopAnimations(
        opacity: Float,
        translateX: Float,
        translateY: Float,
        scaleX: Float,
        scaleY: Float,
        rotate: Float,
        rotateX: Float,
        rotateY: Float,
        borderRadius: Float,
        borderWidth: Float,
        elevation: Float
    ) {
        if (runningAnimators.isEmpty()) return

        val mask = animatedProperties
        for ((animatorKey, property) in LOOPABLE_PROPERTIES) {
            val animator = runningAnimators[animatorKey] as? ValueAnimator ?: continue
            if (animator.repeatCount != ValueAnimator.INFINITE) continue

            val (propertyMask, configName) = property
            val stillAnimated = mask and propertyMask != 0
            if (stillAnimated && getTransitionConfig(configName).loop.let { it == "repeat" || it == "reverse" }) {
                continue
            }

            animator.cancel()
            runningAnimators.remove(animatorKey)

            // cancel() strands the property wherever the sweep happened to be,
            // so write the resting state the current props ask for. Every
            // animate* prop carries its identity value once JS clears the mask
            // bit, so the incoming values are correct either way. Colors are
            // skipped — an unset color has no identity value and the style now
            // owns it.
            val target: Float
            val prev: Float?
            val apply: (Float) -> Unit
            when (animatorKey) {
                "alpha" -> { target = opacity; prev = prevOpacity; apply = { this.alpha = it } }
                "translationX" -> { target = translateX; prev = prevTranslateX; apply = { this.translationX = it } }
                "translationY" -> { target = translateY; prev = prevTranslateY; apply = { this.translationY = it } }
                "scaleX" -> { target = scaleX; prev = prevScaleX; apply = { this.scaleX = it } }
                "scaleY" -> { target = scaleY; prev = prevScaleY; apply = { this.scaleY = it } }
                "rotation" -> { target = rotate; prev = prevRotate; apply = { this.rotation = it } }
                "rotationX" -> { target = rotateX; prev = prevRotateX; apply = { this.rotationX = it } }
                "rotationY" -> { target = rotateY; prev = prevRotateY; apply = { this.rotationY = it } }
                "animateBorderRadius" -> { target = borderRadius; prev = prevBorderRadius; apply = { setAnimateBorderRadius(it) } }
                "animateBorderWidth" -> { target = borderWidth; prev = prevBorderWidth; apply = { setAnimateBorderWidth(it) } }
                "elevation" -> { target = elevation; prev = prevElevation; apply = { this.elevation = it } }
                else -> continue
            }

            // Skip only when a path below will animate this property anyway:
            // those read the live view value as their "from", so writing the
            // target first would flatten the animation into a no-op.
            if (stillAnimated && prev != null && prev != target) continue
            apply(target)
        }
    }

    companion object {
        // Bitmask flags — must match JS constants
        const val MASK_OPACITY = 1 shl 0
        const val MASK_TRANSLATE_X = 1 shl 1
        const val MASK_TRANSLATE_Y = 1 shl 2
        const val MASK_SCALE_X = 1 shl 3
        const val MASK_SCALE_Y = 1 shl 4
        const val MASK_ROTATE = 1 shl 5
        const val MASK_ROTATE_X = 1 shl 6
        const val MASK_ROTATE_Y = 1 shl 7
        const val MASK_BORDER_RADIUS = 1 shl 8
        const val MASK_BACKGROUND_COLOR = 1 shl 9
        const val MASK_BORDER_WIDTH = 1 shl 10
        const val MASK_BORDER_COLOR = 1 shl 11
        // Masks 12-15 are shadow properties (iOS only)
        const val MASK_ELEVATION = 1 shl 16

        // runningAnimators key → (mask bit, getTransitionConfig name)
        private val LOOPABLE_PROPERTIES = listOf(
            "alpha" to (MASK_OPACITY to "opacity"),
            "translationX" to (MASK_TRANSLATE_X to "translateX"),
            "translationY" to (MASK_TRANSLATE_Y to "translateY"),
            "scaleX" to (MASK_SCALE_X to "scaleX"),
            "scaleY" to (MASK_SCALE_Y to "scaleY"),
            "rotation" to (MASK_ROTATE to "rotate"),
            "rotationX" to (MASK_ROTATE_X to "rotateX"),
            "rotationY" to (MASK_ROTATE_Y to "rotateY"),
            "animateBorderRadius" to (MASK_BORDER_RADIUS to "borderRadius"),
            "backgroundColor" to (MASK_BACKGROUND_COLOR to "backgroundColor"),
            "animateBorderWidth" to (MASK_BORDER_WIDTH to "borderWidth"),
            "borderColor" to (MASK_BORDER_COLOR to "borderColor"),
            "elevation" to (MASK_ELEVATION to "elevation"),
        )
    }

    // --- Transform origin (0–1 fractions) ---
    var transformOriginX: Float = 0.5f
        set(value) {
            field = value
            applyTransformOrigin()
        }
    var transformOriginY: Float = 0.5f
        set(value) {
            field = value
            applyTransformOrigin()
        }

    // --- Border radius (hardware-accelerated via outline clipping) ---
    // Animated via ObjectAnimator("animateBorderRadius") — setter invalidates outline each frame.
    private var _borderRadius: Float = 0f

    @Suppress("unused") // Used by ObjectAnimator via reflection
    fun getAnimateBorderRadius(): Float = _borderRadius
    @Suppress("unused") // Used by ObjectAnimator via reflection
    fun setAnimateBorderRadius(value: Float) {
        if (_borderRadius != value) {
            _borderRadius = value
            if (value > 0f) {
                clipToOutline = true
            } else {
                clipToOutline = false
            }
            invalidateOutline()
            // Sync border drawable so borders follow the animated corner radius.
            // Value is in pixels; convert back to DIPs for BackgroundStyleApplicator.
            val dip = PixelUtil.toDIPFromPixel(value)
            BackgroundStyleApplicator.setBorderRadius(
                this, BorderRadiusProp.BORDER_RADIUS,
                LengthPercentage(dip, LengthPercentageType.POINT))
        }
    }

    // --- Border width (animated via ObjectAnimator("animateBorderWidth")) ---
    private var _borderWidth: Float = 0f

    @Suppress("unused") // Used by ObjectAnimator via reflection
    fun getAnimateBorderWidth(): Float = _borderWidth
    @Suppress("unused") // Used by ObjectAnimator via reflection
    fun setAnimateBorderWidth(value: Float) {
        if (_borderWidth != value) {
            _borderWidth = value
            BackgroundStyleApplicator.setBorderWidth(this, LogicalEdge.ALL, value)
        }
    }

    private fun applyBorderColor(color: Int) {
        currentBorderColor = color
        BackgroundStyleApplicator.setBorderColor(this, LogicalEdge.ALL, color)
    }

    private fun getCurrentBorderColor(): Int {
        return currentBorderColor
    }

    // --- Hardware layer ---
    var useHardwareLayer: Boolean = false

    // --- Event callback ---
    var onTransitionEnd: ((finished: Boolean) -> Unit)? = null
    private var activeAnimationCount: Int = 0
    private var animationBatchId: Int = 0
    private var pendingBatchAnimationCount: Int = 0
    private var anyInterrupted: Boolean = false
    private var savedLayerType: Int = View.LAYER_TYPE_NONE

    // --- Initial animate values (set by ViewManager) ---
    var initialAnimateOpacity: Float = 1.0f
    var initialAnimateTranslateX: Float = 0.0f
    var initialAnimateTranslateY: Float = 0.0f
    var initialAnimateScaleX: Float = 1.0f
    var initialAnimateScaleY: Float = 1.0f
    var initialAnimateRotate: Float = 0.0f
    var initialAnimateRotateX: Float = 0.0f
    var initialAnimateRotateY: Float = 0.0f
    var initialAnimateBorderRadius: Float = 0.0f
    var initialAnimateBackgroundColor: Int = Color.TRANSPARENT
    var initialAnimateBorderWidth: Float = 0.0f
    var initialAnimateBorderColor: Int = Color.BLACK
    var initialAnimateElevation: Float = 0.0f

    // --- Pending animate values (buffered per-view, applied in onAfterUpdateTransaction) ---
    var pendingOpacity: Float = 1.0f
    var pendingTranslateX: Float = 0.0f
    var pendingTranslateY: Float = 0.0f
    var pendingScaleX: Float = 1.0f
    var pendingScaleY: Float = 1.0f
    var pendingRotate: Float = 0.0f
    var pendingRotateX: Float = 0.0f
    var pendingRotateY: Float = 0.0f
    var pendingBorderRadius: Float = 0.0f
    var pendingBackgroundColor: Int = Color.TRANSPARENT
    var pendingBorderWidth: Float = 0.0f
    var pendingBorderColor: Int = Color.BLACK
    var pendingElevation: Float = 0.0f

    // --- Running animations ---
    private val runningAnimators = mutableMapOf<String, Animator>()
    private val runningSpringAnimations = mutableMapOf<DynamicAnimation.ViewProperty, SpringAnimation>()
    private val pendingDelayedRunnables = mutableListOf<Runnable>()

    // --- Animated properties bitmask (set by ViewManager) ---
    var animatedProperties: Int = 0

    // --- Transform perspective (camera distance for 3D rotations) ---
    var transformPerspective: Float = 1280f
        set(value) {
            field = value
            applyCameraDistance(value)
        }

    private fun applyCameraDistance(perspective: Float) {
        // Match React Native's conversion from CSS perspective to Android cameraDistance.
        // https://github.com/facebook/react-native/blob/a98aa814/ReactAndroid/src/main/java/com/facebook/react/uimanager/BaseViewManager.java#L626-L637
        val density = resources.displayMetrics.density
        cameraDistance = density * density * perspective * CAMERA_DISTANCE_NORMALIZATION_MULTIPLIER
    }

    // Custom outline provider used when borderRadius is animated.
    // Reads _borderRadius dynamically — invalidated on each frame by setAnimateBorderRadius.
    private val animatedOutlineProvider = object : ViewOutlineProvider() {
        override fun getOutline(view: View, outline: Outline) {
            outline.setRoundRect(0, 0, view.width, view.height, _borderRadius)
        }
    }

    init {
        applyCameraDistance(1280f)
    }

    // --- Hardware layer management ---

    private fun onEaseAnimationStart() {
        if (activeAnimationCount == 0 && useHardwareLayer) {
            savedLayerType = layerType
            setLayerType(View.LAYER_TYPE_HARDWARE, null)
        }
        activeAnimationCount++
    }

    private fun onEaseAnimationEnd() {
        activeAnimationCount--
        if (activeAnimationCount <= 0) {
            activeAnimationCount = 0
            if (useHardwareLayer && layerType == View.LAYER_TYPE_HARDWARE) {
                setLayerType(savedLayerType, null)
            }
        }
    }

    // --- Transform origin ---

    fun applyTransformOrigin() {
        if (width > 0 && height > 0) {
            pivotX = width * transformOriginX
            pivotY = height * transformOriginY
        }
    }

    override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
        super.onLayout(changed, left, top, right, bottom)
        applyTransformOrigin()
    }

    fun applyPendingAnimateValues() {
        applyAnimateValues(pendingOpacity, pendingTranslateX, pendingTranslateY, pendingScaleX, pendingScaleY, pendingRotate, pendingRotateX, pendingRotateY, pendingBorderRadius, pendingBackgroundColor, pendingBorderWidth, pendingBorderColor, pendingElevation)
    }

    private fun applyAnimateValues(
        opacity: Float,
        translateX: Float,
        translateY: Float,
        scaleX: Float,
        scaleY: Float,
        rotate: Float,
        rotateX: Float,
        rotateY: Float,
        borderRadius: Float,
        backgroundColor: Int,
        borderWidth: Float,
        borderColor: Int,
        elevation: Float
    ) {
        if (pendingBatchAnimationCount > 0) {
            onTransitionEnd?.invoke(false)
        }

        animationBatchId++
        pendingBatchAnimationCount = 0
        anyInterrupted = false

        // Bitmask: which properties are animated. Non-animated = let style handle.
        val mask = animatedProperties

        // Use custom outline provider only when borderRadius is animated.
        // Otherwise fall back to BACKGROUND provider so elevation shadows
        // respect the style borderRadius from the background drawable.
        val needsCustomOutline = mask and MASK_BORDER_RADIUS != 0
        if (needsCustomOutline && outlineProvider !== animatedOutlineProvider) {
            outlineProvider = animatedOutlineProvider
        } else if (!needsCustomOutline && outlineProvider === animatedOutlineProvider) {
            outlineProvider = ViewOutlineProvider.BACKGROUND
        }

        if (isFirstMount) {
            isFirstMount = false

            val hasInitialAnimation =
                (mask and MASK_OPACITY != 0 && initialAnimateOpacity != opacity) ||
                (mask and MASK_TRANSLATE_X != 0 && initialAnimateTranslateX != translateX) ||
                (mask and MASK_TRANSLATE_Y != 0 && initialAnimateTranslateY != translateY) ||
                (mask and MASK_SCALE_X != 0 && initialAnimateScaleX != scaleX) ||
                (mask and MASK_SCALE_Y != 0 && initialAnimateScaleY != scaleY) ||
                (mask and MASK_ROTATE != 0 && initialAnimateRotate != rotate) ||
                (mask and MASK_ROTATE_X != 0 && initialAnimateRotateX != rotateX) ||
                (mask and MASK_ROTATE_Y != 0 && initialAnimateRotateY != rotateY) ||
                (mask and MASK_BORDER_RADIUS != 0 && initialAnimateBorderRadius != borderRadius) ||
                (mask and MASK_BACKGROUND_COLOR != 0 && initialAnimateBackgroundColor != backgroundColor) ||
                (mask and MASK_BORDER_WIDTH != 0 && initialAnimateBorderWidth != borderWidth) ||
                (mask and MASK_BORDER_COLOR != 0 && initialAnimateBorderColor != borderColor) ||
                (mask and MASK_ELEVATION != 0 && initialAnimateElevation != elevation)

            if (hasInitialAnimation) {
                // Set initial values for animated properties
                if (mask and MASK_OPACITY != 0) this.alpha = initialAnimateOpacity
                if (mask and MASK_TRANSLATE_X != 0) this.translationX = initialAnimateTranslateX
                if (mask and MASK_TRANSLATE_Y != 0) this.translationY = initialAnimateTranslateY
                if (mask and MASK_SCALE_X != 0) this.scaleX = initialAnimateScaleX
                if (mask and MASK_SCALE_Y != 0) this.scaleY = initialAnimateScaleY
                if (mask and MASK_ROTATE != 0) this.rotation = initialAnimateRotate
                if (mask and MASK_ROTATE_X != 0) this.rotationX = initialAnimateRotateX
                if (mask and MASK_ROTATE_Y != 0) this.rotationY = initialAnimateRotateY
                if (mask and MASK_BORDER_RADIUS != 0) setAnimateBorderRadius(initialAnimateBorderRadius)
                if (mask and MASK_BACKGROUND_COLOR != 0) applyBackgroundColor(initialAnimateBackgroundColor)
                if (mask and MASK_BORDER_WIDTH != 0) setAnimateBorderWidth(initialAnimateBorderWidth)
                if (mask and MASK_BORDER_COLOR != 0) applyBorderColor(initialAnimateBorderColor)
                if (mask and MASK_ELEVATION != 0) this.elevation = initialAnimateElevation

                // Animate properties that differ from initial to target
                if (mask and MASK_OPACITY != 0 && initialAnimateOpacity != opacity) {
                    animateProperty("alpha", DynamicAnimation.ALPHA, initialAnimateOpacity, opacity, getTransitionConfig("opacity"), loop = true)
                }
                if (mask and MASK_TRANSLATE_X != 0 && initialAnimateTranslateX != translateX) {
                    animateProperty("translationX", DynamicAnimation.TRANSLATION_X, initialAnimateTranslateX, translateX, getTransitionConfig("translateX"), loop = true)
                }
                if (mask and MASK_TRANSLATE_Y != 0 && initialAnimateTranslateY != translateY) {
                    animateProperty("translationY", DynamicAnimation.TRANSLATION_Y, initialAnimateTranslateY, translateY, getTransitionConfig("translateY"), loop = true)
                }
                if (mask and MASK_SCALE_X != 0 && initialAnimateScaleX != scaleX) {
                    animateProperty("scaleX", DynamicAnimation.SCALE_X, initialAnimateScaleX, scaleX, getTransitionConfig("scaleX"), loop = true)
                }
                if (mask and MASK_SCALE_Y != 0 && initialAnimateScaleY != scaleY) {
                    animateProperty("scaleY", DynamicAnimation.SCALE_Y, initialAnimateScaleY, scaleY, getTransitionConfig("scaleY"), loop = true)
                }
                if (mask and MASK_ROTATE != 0 && initialAnimateRotate != rotate) {
                    animateProperty("rotation", DynamicAnimation.ROTATION, initialAnimateRotate, rotate, getTransitionConfig("rotate"), loop = true)
                }
                if (mask and MASK_ROTATE_X != 0 && initialAnimateRotateX != rotateX) {
                    animateProperty("rotationX", DynamicAnimation.ROTATION_X, initialAnimateRotateX, rotateX, getTransitionConfig("rotateX"), loop = true)
                }
                if (mask and MASK_ROTATE_Y != 0 && initialAnimateRotateY != rotateY) {
                    animateProperty("rotationY", DynamicAnimation.ROTATION_Y, initialAnimateRotateY, rotateY, getTransitionConfig("rotateY"), loop = true)
                }
                if (mask and MASK_BORDER_RADIUS != 0 && initialAnimateBorderRadius != borderRadius) {
                    animateProperty("animateBorderRadius", null, initialAnimateBorderRadius, borderRadius, getTransitionConfig("borderRadius"), loop = true)
                }
                if (mask and MASK_BACKGROUND_COLOR != 0 && initialAnimateBackgroundColor != backgroundColor) {
                    animateBackgroundColor(initialAnimateBackgroundColor, backgroundColor, getTransitionConfig("backgroundColor"), loop = true)
                }
                if (mask and MASK_BORDER_WIDTH != 0 && initialAnimateBorderWidth != borderWidth) {
                    animateProperty("animateBorderWidth", null, initialAnimateBorderWidth, borderWidth, getTransitionConfig("borderWidth"), loop = true)
                }
                if (mask and MASK_BORDER_COLOR != 0 && initialAnimateBorderColor != borderColor) {
                    animateBorderColorTransition(initialAnimateBorderColor, borderColor, getTransitionConfig("borderColor"), loop = true)
                }
                if (mask and MASK_ELEVATION != 0 && initialAnimateElevation != elevation) {
                    animateProperty("elevation", null, initialAnimateElevation, elevation, getTransitionConfig("elevation"), loop = true)
                }

                // If all per-property configs were 'none', no animations were queued.
                // Fire onTransitionEnd immediately to match the scalar 'none' contract.
                if (pendingBatchAnimationCount == 0) {
                    onTransitionEnd?.invoke(true)
                }
            } else {
                // No initial animation — set target values directly (skip non-animated)
                if (mask and MASK_OPACITY != 0) this.alpha = opacity
                if (mask and MASK_TRANSLATE_X != 0) this.translationX = translateX
                if (mask and MASK_TRANSLATE_Y != 0) this.translationY = translateY
                if (mask and MASK_SCALE_X != 0) this.scaleX = scaleX
                if (mask and MASK_SCALE_Y != 0) this.scaleY = scaleY
                if (mask and MASK_ROTATE != 0) this.rotation = rotate
                if (mask and MASK_ROTATE_X != 0) this.rotationX = rotateX
                if (mask and MASK_ROTATE_Y != 0) this.rotationY = rotateY
                if (mask and MASK_BORDER_RADIUS != 0) setAnimateBorderRadius(borderRadius)
                if (mask and MASK_BACKGROUND_COLOR != 0) applyBackgroundColor(backgroundColor)
                if (mask and MASK_BORDER_WIDTH != 0) setAnimateBorderWidth(borderWidth)
                if (mask and MASK_BORDER_COLOR != 0) applyBorderColor(borderColor)
                if (mask and MASK_ELEVATION != 0) this.elevation = elevation
            }

            // Update backface visibility after setting initial rotation values.
            // Skip when opacity is animated — backface check resets alpha.
            // https://github.com/facebook/react-native/blob/a98aa814/ReactAndroid/src/main/java/com/facebook/react/views/view/ReactViewGroup.kt#L967-L985
            if (mask and (MASK_ROTATE or MASK_ROTATE_X or MASK_ROTATE_Y) != 0 &&
                mask and MASK_OPACITY == 0) {
                setBackfaceVisibilityDependantOpacity()
            }
        } else if (allTransitionsNone()) {
            // No transition (scalar) — set values immediately, cancel running animations
            cancelAllAnimations()
            if (mask and MASK_OPACITY != 0) this.alpha = opacity
            if (mask and MASK_TRANSLATE_X != 0) this.translationX = translateX
            if (mask and MASK_TRANSLATE_Y != 0) this.translationY = translateY
            if (mask and MASK_SCALE_X != 0) this.scaleX = scaleX
            if (mask and MASK_SCALE_Y != 0) this.scaleY = scaleY
            if (mask and MASK_ROTATE != 0) this.rotation = rotate
            if (mask and MASK_ROTATE_X != 0) this.rotationX = rotateX
            if (mask and MASK_ROTATE_Y != 0) this.rotationY = rotateY
            if (mask and MASK_BORDER_RADIUS != 0) setAnimateBorderRadius(borderRadius)
            if (mask and MASK_BACKGROUND_COLOR != 0) applyBackgroundColor(backgroundColor)
            if (mask and MASK_BORDER_WIDTH != 0) setAnimateBorderWidth(borderWidth)
            if (mask and MASK_BORDER_COLOR != 0) applyBorderColor(borderColor)
            if (mask and MASK_ELEVATION != 0) this.elevation = elevation
            onTransitionEnd?.invoke(true)
        } else {
            // Subsequent updates: animate changed properties (skip non-animated)
            // Runs after the animationBatchId bump above so the cancellations
            // can't be mistaken for this batch's animations completing.
            removeStaleLoopAnimations(
                opacity, translateX, translateY, scaleX, scaleY,
                rotate, rotateX, rotateY, borderRadius, borderWidth, elevation
            )
            var anyPropertyChanged = false

            if (prevOpacity != null && mask and MASK_OPACITY != 0 && prevOpacity != opacity) {
                anyPropertyChanged = true
                val config = getTransitionConfig("opacity")
                if (config.type == "none") {
                    cancelSpringForProperty("alpha")
                    runningAnimators["alpha"]?.cancel()
                    runningAnimators.remove("alpha")
                    this.alpha = opacity
                } else {
                    val from = getCurrentValue("alpha")
                    animateProperty("alpha", DynamicAnimation.ALPHA, from, opacity, config)
                }
            }

            if (prevTranslateX != null && mask and MASK_TRANSLATE_X != 0 && prevTranslateX != translateX) {
                anyPropertyChanged = true
                val config = getTransitionConfig("translateX")
                if (config.type == "none") {
                    cancelSpringForProperty("translationX")
                    runningAnimators["translationX"]?.cancel()
                    runningAnimators.remove("translationX")
                    this.translationX = translateX
                } else {
                    val from = getCurrentValue("translationX")
                    animateProperty("translationX", DynamicAnimation.TRANSLATION_X, from, translateX, config)
                }
            }

            if (prevTranslateY != null && mask and MASK_TRANSLATE_Y != 0 && prevTranslateY != translateY) {
                anyPropertyChanged = true
                val config = getTransitionConfig("translateY")
                if (config.type == "none") {
                    cancelSpringForProperty("translationY")
                    runningAnimators["translationY"]?.cancel()
                    runningAnimators.remove("translationY")
                    this.translationY = translateY
                } else {
                    val from = getCurrentValue("translationY")
                    animateProperty("translationY", DynamicAnimation.TRANSLATION_Y, from, translateY, config)
                }
            }

            if (prevScaleX != null && mask and MASK_SCALE_X != 0 && prevScaleX != scaleX) {
                anyPropertyChanged = true
                val config = getTransitionConfig("scaleX")
                if (config.type == "none") {
                    cancelSpringForProperty("scaleX")
                    runningAnimators["scaleX"]?.cancel()
                    runningAnimators.remove("scaleX")
                    this.scaleX = scaleX
                } else {
                    val from = getCurrentValue("scaleX")
                    animateProperty("scaleX", DynamicAnimation.SCALE_X, from, scaleX, config)
                }
            }

            if (prevScaleY != null && mask and MASK_SCALE_Y != 0 && prevScaleY != scaleY) {
                anyPropertyChanged = true
                val config = getTransitionConfig("scaleY")
                if (config.type == "none") {
                    cancelSpringForProperty("scaleY")
                    runningAnimators["scaleY"]?.cancel()
                    runningAnimators.remove("scaleY")
                    this.scaleY = scaleY
                } else {
                    val from = getCurrentValue("scaleY")
                    animateProperty("scaleY", DynamicAnimation.SCALE_Y, from, scaleY, config)
                }
            }

            if (prevRotate != null && mask and MASK_ROTATE != 0 && prevRotate != rotate) {
                anyPropertyChanged = true
                val config = getTransitionConfig("rotate")
                if (config.type == "none") {
                    cancelSpringForProperty("rotation")
                    runningAnimators["rotation"]?.cancel()
                    runningAnimators.remove("rotation")
                    this.rotation = rotate
                } else {
                    val from = getCurrentValue("rotation")
                    animateProperty("rotation", DynamicAnimation.ROTATION, from, rotate, config)
                }
            }

            if (prevRotateX != null && mask and MASK_ROTATE_X != 0 && prevRotateX != rotateX) {
                anyPropertyChanged = true
                val config = getTransitionConfig("rotateX")
                if (config.type == "none") {
                    cancelSpringForProperty("rotationX")
                    runningAnimators["rotationX"]?.cancel()
                    runningAnimators.remove("rotationX")
                    this.rotationX = rotateX
                } else {
                    val from = getCurrentValue("rotationX")
                    animateProperty("rotationX", DynamicAnimation.ROTATION_X, from, rotateX, config)
                }
            }

            if (prevRotateY != null && mask and MASK_ROTATE_Y != 0 && prevRotateY != rotateY) {
                anyPropertyChanged = true
                val config = getTransitionConfig("rotateY")
                if (config.type == "none") {
                    cancelSpringForProperty("rotationY")
                    runningAnimators["rotationY"]?.cancel()
                    runningAnimators.remove("rotationY")
                    this.rotationY = rotateY
                } else {
                    val from = getCurrentValue("rotationY")
                    animateProperty("rotationY", DynamicAnimation.ROTATION_Y, from, rotateY, config)
                }
            }

            if (prevBorderRadius != null && mask and MASK_BORDER_RADIUS != 0 && prevBorderRadius != borderRadius) {
                anyPropertyChanged = true
                val config = getTransitionConfig("borderRadius")
                if (config.type == "none") {
                    runningAnimators["animateBorderRadius"]?.cancel()
                    runningAnimators.remove("animateBorderRadius")
                    setAnimateBorderRadius(borderRadius)
                } else {
                    val from = getCurrentValue("animateBorderRadius")
                    animateProperty("animateBorderRadius", null, from, borderRadius, config)
                }
            }

            if (prevBackgroundColor != null && mask and MASK_BACKGROUND_COLOR != 0 && prevBackgroundColor != backgroundColor) {
                anyPropertyChanged = true
                val config = getTransitionConfig("backgroundColor")
                if (config.type == "none") {
                    runningAnimators["backgroundColor"]?.cancel()
                    runningAnimators.remove("backgroundColor")
                    applyBackgroundColor(backgroundColor)
                } else {
                    animateBackgroundColor(getCurrentBackgroundColor(), backgroundColor, config)
                }
            }

            if (prevBorderWidth != null && mask and MASK_BORDER_WIDTH != 0 && prevBorderWidth != borderWidth) {
                anyPropertyChanged = true
                val config = getTransitionConfig("borderWidth")
                if (config.type == "none") {
                    runningAnimators["animateBorderWidth"]?.cancel()
                    runningAnimators.remove("animateBorderWidth")
                    setAnimateBorderWidth(borderWidth)
                } else {
                    val from = getCurrentValue("animateBorderWidth")
                    animateProperty("animateBorderWidth", null, from, borderWidth, config)
                }
            }

            if (prevBorderColor != null && mask and MASK_BORDER_COLOR != 0 && prevBorderColor != borderColor) {
                anyPropertyChanged = true
                val config = getTransitionConfig("borderColor")
                if (config.type == "none") {
                    runningAnimators["borderColor"]?.cancel()
                    runningAnimators.remove("borderColor")
                    applyBorderColor(borderColor)
                } else {
                    animateBorderColorTransition(getCurrentBorderColor(), borderColor, config)
                }
            }

            if (prevElevation != null && mask and MASK_ELEVATION != 0 && prevElevation != elevation) {
                anyPropertyChanged = true
                val config = getTransitionConfig("elevation")
                if (config.type == "none") {
                    runningAnimators["elevation"]?.cancel()
                    runningAnimators.remove("elevation")
                    this.elevation = elevation
                } else {
                    val from = getCurrentValue("elevation")
                    animateProperty("elevation", null, from, elevation, config)
                }
            }

            // If all changed properties resolved to 'none', no animations were queued.
            // Fire onTransitionEnd immediately.
            if (anyPropertyChanged && pendingBatchAnimationCount == 0) {
                onTransitionEnd?.invoke(true)
            }
        }

        prevOpacity = opacity
        prevTranslateX = translateX
        prevTranslateY = translateY
        prevScaleX = scaleX
        prevScaleY = scaleY
        prevRotate = rotate
        prevRotateX = rotateX
        prevRotateY = rotateY
        prevBorderRadius = borderRadius
        prevBackgroundColor = backgroundColor
        prevBorderWidth = borderWidth
        prevBorderColor = borderColor
        prevElevation = elevation
    }

    private fun getCurrentValue(propertyName: String): Float = when (propertyName) {
        "alpha" -> this.alpha
        "translationX" -> this.translationX
        "translationY" -> this.translationY
        "scaleX" -> this.scaleX
        "scaleY" -> this.scaleY
        "rotation" -> this.rotation
        "rotationX" -> this.rotationX
        "rotationY" -> this.rotationY
        "animateBorderRadius" -> getAnimateBorderRadius()
        "animateBorderWidth" -> getAnimateBorderWidth()
        "elevation" -> this.elevation
        else -> 0f
    }

    private fun getCurrentBackgroundColor(): Int {
        return currentBackgroundColor
    }

    private fun applyBackgroundColor(color: Int) {
        currentBackgroundColor = color
        BackgroundStyleApplicator.setBackgroundColor(this, color)
    }

    private fun animateBackgroundColor(fromColor: Int, toColor: Int, config: TransitionConfig, loop: Boolean = false) {
        runningAnimators["backgroundColor"]?.cancel()

        val batchId = animationBatchId
        pendingBatchAnimationCount++

        val animator = ValueAnimator.ofArgb(fromColor, toColor).apply {
            duration = config.duration.toLong()
            startDelay = config.delay

            interpolator = PathInterpolator(
                config.easingBezier[0], config.easingBezier[1],
                config.easingBezier[2], config.easingBezier[3]
            )
            if (loop && config.loop != "none") {
                repeatCount = ValueAnimator.INFINITE
                repeatMode = if (config.loop == "reverse") ValueAnimator.REVERSE else ValueAnimator.RESTART
            }
            addUpdateListener { animation ->
                val color = animation.animatedValue as Int
                this@EaseView.applyBackgroundColor(color)
            }
            addListener(object : AnimatorListenerAdapter() {
                private var cancelled = false
                override fun onAnimationStart(animation: Animator) {
                    this@EaseView.onEaseAnimationStart()
                }
                override fun onAnimationCancel(animation: Animator) { cancelled = true }
                override fun onAnimationEnd(animation: Animator) {
                    this@EaseView.onEaseAnimationEnd()
                    if (batchId == animationBatchId) {
                        if (cancelled) anyInterrupted = true
                        pendingBatchAnimationCount--
                        if (pendingBatchAnimationCount <= 0) {
                            onTransitionEnd?.invoke(!anyInterrupted)
                        }
                    }
                }
            })
        }

        runningAnimators["backgroundColor"] = animator
        animator.start()
    }

    private fun animateBorderColorTransition(fromColor: Int, toColor: Int, config: TransitionConfig, loop: Boolean = false) {
        runningAnimators["borderColor"]?.cancel()

        val batchId = animationBatchId
        pendingBatchAnimationCount++

        val animator = ValueAnimator.ofArgb(fromColor, toColor).apply {
            duration = config.duration.toLong()
            startDelay = config.delay

            interpolator = PathInterpolator(
                config.easingBezier[0], config.easingBezier[1],
                config.easingBezier[2], config.easingBezier[3]
            )
            if (loop && config.loop != "none") {
                repeatCount = ValueAnimator.INFINITE
                repeatMode = if (config.loop == "reverse") ValueAnimator.REVERSE else ValueAnimator.RESTART
            }
            addUpdateListener { animation ->
                this@EaseView.applyBorderColor(animation.animatedValue as Int)
            }
            addListener(object : AnimatorListenerAdapter() {
                private var cancelled = false
                override fun onAnimationStart(animation: Animator) {
                    this@EaseView.onEaseAnimationStart()
                }
                override fun onAnimationCancel(animation: Animator) { cancelled = true }
                override fun onAnimationEnd(animation: Animator) {
                    this@EaseView.onEaseAnimationEnd()
                    if (batchId == animationBatchId) {
                        if (cancelled) anyInterrupted = true
                        pendingBatchAnimationCount--
                        if (pendingBatchAnimationCount <= 0) {
                            onTransitionEnd?.invoke(!anyInterrupted)
                        }
                    }
                }
            })
        }

        runningAnimators["borderColor"] = animator
        animator.start()
    }

    private fun animateProperty(
        propertyName: String,
        viewProperty: DynamicAnimation.ViewProperty?,
        fromValue: Float,
        toValue: Float,
        config: TransitionConfig,
        loop: Boolean = false
    ) {
        if (config.type == "none") {
            // Set immediately — cancel any running animation for this property
            cancelSpringForProperty(propertyName)
            runningAnimators[propertyName]?.cancel()
            runningAnimators.remove(propertyName)
            ObjectAnimator.ofFloat(this, propertyName, toValue).apply {
                duration = 0
                start()
            }
            return
        }
        if (config.type == "spring" && viewProperty != null) {
            animateSpring(viewProperty, toValue, config)
        } else {
            animateTiming(propertyName, fromValue, toValue, config, loop)
        }
    }

    // React Native's backfaceVisibility on Android checks rotationX/rotationY and sets alpha=0
    // when the back face is showing. We must call setBackfaceVisibilityDependantOpacity() during
    // rotation animations so the check runs each frame.
    // https://github.com/facebook/react-native/blob/a98aa814/ReactAndroid/src/main/java/com/facebook/react/views/view/ReactViewGroup.kt#L967-L985
    private val isRotationProperty = setOf("rotation", "rotationX", "rotationY")

    private fun animateTiming(propertyName: String, fromValue: Float, toValue: Float, config: TransitionConfig, loop: Boolean = false) {
        cancelSpringForProperty(propertyName)
        runningAnimators[propertyName]?.cancel()

        val batchId = animationBatchId
        pendingBatchAnimationCount++
        // Only update backface visibility when opacity is NOT animated — the backface
        // check resets alpha, which would clobber the animated opacity value.
        val needsBackfaceUpdate = propertyName in isRotationProperty &&
            (animatedProperties and MASK_OPACITY == 0)

        val animator = ObjectAnimator.ofFloat(this, propertyName, fromValue, toValue).apply {
            duration = config.duration.toLong()
            startDelay = config.delay

            interpolator = PathInterpolator(
                config.easingBezier[0], config.easingBezier[1],
                config.easingBezier[2], config.easingBezier[3]
            )
            if (loop && config.loop != "none") {
                repeatCount = ObjectAnimator.INFINITE
                repeatMode = if (config.loop == "reverse") {
                    ObjectAnimator.REVERSE
                } else {
                    ObjectAnimator.RESTART
                }
            }
            if (needsBackfaceUpdate) {
                addUpdateListener { this@EaseView.setBackfaceVisibilityDependantOpacity() }
            }
            addListener(object : AnimatorListenerAdapter() {
                private var cancelled = false
                override fun onAnimationStart(animation: Animator) {
                    this@EaseView.onEaseAnimationStart()
                }
                override fun onAnimationCancel(animation: Animator) {
                    cancelled = true
                }
                override fun onAnimationEnd(animation: Animator) {
                    this@EaseView.onEaseAnimationEnd()
                    if (batchId == animationBatchId) {
                        if (cancelled) anyInterrupted = true
                        pendingBatchAnimationCount--
                        if (pendingBatchAnimationCount <= 0) {
                            onTransitionEnd?.invoke(!anyInterrupted)
                        }
                    }
                }
            })
        }

        runningAnimators[propertyName] = animator
        animator.start()
    }

    private fun animateSpring(viewProperty: DynamicAnimation.ViewProperty, toValue: Float, config: TransitionConfig) {
        cancelTimingForViewProperty(viewProperty)

        // Cancel any existing spring so we get a fresh end listener with the current batchId.
        runningSpringAnimations[viewProperty]?.let { existing ->
            if (existing.isRunning) {
                existing.cancel()
            }
        }
        runningSpringAnimations.remove(viewProperty)

        val batchId = animationBatchId
        pendingBatchAnimationCount++

        val needsBackfaceUpdate = (viewProperty == DynamicAnimation.ROTATION ||
            viewProperty == DynamicAnimation.ROTATION_X ||
            viewProperty == DynamicAnimation.ROTATION_Y) &&
            (animatedProperties and MASK_OPACITY == 0)

        val dampingRatio = (config.damping / (2.0f * sqrt(config.stiffness * config.mass)))
            .coerceAtLeast(0.01f)

        // translationX/Y animate in pixels, so a DIP/s velocity has to be converted
        // the same way the target value is in EaseViewManager. Every other property
        // (scale, rotation, alpha) already shares its unit with the JS side.
        val startVelocity = when (viewProperty) {
            DynamicAnimation.TRANSLATION_X, DynamicAnimation.TRANSLATION_Y ->
                PixelUtil.toPixelFromDIP(config.velocity)
            else -> config.velocity
        }

        val spring = SpringAnimation(this, viewProperty).apply {
            spring = SpringForce(toValue).apply {
                this.dampingRatio = dampingRatio
                this.stiffness = config.stiffness
            }
            if (startVelocity != 0f) {
                setStartVelocity(startVelocity)
            }
            addUpdateListener { _, _, _ ->
                // First update — enable hardware layer
                if (activeAnimationCount == 0) {
                    this@EaseView.onEaseAnimationStart()
                }
                if (needsBackfaceUpdate) {
                    this@EaseView.setBackfaceVisibilityDependantOpacity()
                }
            }
            addEndListener { _, canceled, _, _ ->
                this@EaseView.onEaseAnimationEnd()
                if (batchId == animationBatchId) {
                    if (canceled) anyInterrupted = true
                    pendingBatchAnimationCount--
                    if (pendingBatchAnimationCount <= 0) {
                        onTransitionEnd?.invoke(!anyInterrupted)
                    }
                }
            }
        }

        onEaseAnimationStart()
        runningSpringAnimations[viewProperty] = spring
        if (config.delay > 0) {
            val runnable = Runnable { spring.start() }
            pendingDelayedRunnables.add(runnable)
            postDelayed(runnable, config.delay)
        } else {
            spring.start()
        }
    }

    private fun cancelAllAnimations() {
        for (runnable in pendingDelayedRunnables) {
            removeCallbacks(runnable)
        }
        pendingDelayedRunnables.clear()
        for (animator in runningAnimators.values) {
            animator.cancel()
        }
        runningAnimators.clear()
        for (spring in runningSpringAnimations.values) {
            if (spring.isRunning) {
                spring.cancel()
            }
        }
        runningSpringAnimations.clear()
    }

    private fun cancelTimingForViewProperty(viewProperty: DynamicAnimation.ViewProperty) {
        val propertyName = when (viewProperty) {
            DynamicAnimation.ALPHA -> "alpha"
            DynamicAnimation.TRANSLATION_X -> "translationX"
            DynamicAnimation.TRANSLATION_Y -> "translationY"
            DynamicAnimation.SCALE_X -> "scaleX"
            DynamicAnimation.SCALE_Y -> "scaleY"
            DynamicAnimation.ROTATION -> "rotation"
            DynamicAnimation.ROTATION_X -> "rotationX"
            DynamicAnimation.ROTATION_Y -> "rotationY"
            else -> return
        }
        runningAnimators[propertyName]?.cancel()
        runningAnimators.remove(propertyName)
    }

    private fun cancelSpringForProperty(propertyName: String) {
        val viewProperty = when (propertyName) {
            "alpha" -> DynamicAnimation.ALPHA
            "translationX" -> DynamicAnimation.TRANSLATION_X
            "translationY" -> DynamicAnimation.TRANSLATION_Y
            "scaleX" -> DynamicAnimation.SCALE_X
            "scaleY" -> DynamicAnimation.SCALE_Y
            "rotation" -> DynamicAnimation.ROTATION
            "rotationX" -> DynamicAnimation.ROTATION_X
            "rotationY" -> DynamicAnimation.ROTATION_Y
            else -> return
        }
        runningSpringAnimations[viewProperty]?.let { spring ->
            if (spring.isRunning) {
                spring.cancel()
            }
        }
        runningSpringAnimations.remove(viewProperty)
    }

    fun stopAnimations() {
        for (runnable in pendingDelayedRunnables) {
            removeCallbacks(runnable)
        }
        pendingDelayedRunnables.clear()
        for (animator in runningAnimators.values) {
            animator.cancel()
        }
        runningAnimators.clear()

        for (spring in runningSpringAnimations.values) {
            if (spring.isRunning) {
                spring.cancel()
            }
        }
        runningSpringAnimations.clear()

        if (activeAnimationCount > 0 && layerType == View.LAYER_TYPE_HARDWARE) {
            setLayerType(savedLayerType, null)
        }
        activeAnimationCount = 0
        pendingBatchAnimationCount = 0
        anyInterrupted = false
    }

    fun cleanup() {
        stopAnimations()

        prevOpacity = null
        prevTranslateX = null
        prevTranslateY = null
        prevScaleX = null
        prevScaleY = null
        prevRotate = null
        prevRotateX = null
        prevRotateY = null
        prevBorderRadius = null
        prevBackgroundColor = null
        prevBorderWidth = null
        prevBorderColor = null
        prevElevation = null

        this.alpha = 1f
        this.translationX = 0f
        this.translationY = 0f
        this.scaleX = 1f
        this.scaleY = 1f
        this.rotation = 0f
        this.rotationX = 0f
        this.rotationY = 0f
        setAnimateBorderRadius(0f)
        applyBackgroundColor(Color.TRANSPARENT)
        setAnimateBorderWidth(0f)
        applyBorderColor(Color.BLACK)
        this.elevation = 0f
        outlineProvider = ViewOutlineProvider.BACKGROUND

        transformPerspective = 1280f
        isFirstMount = true
        transitionConfigs = emptyMap()
    }
}

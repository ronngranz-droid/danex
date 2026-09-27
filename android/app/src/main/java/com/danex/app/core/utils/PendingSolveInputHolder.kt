package com.danex.app.core.utils

import com.danex.app.domain.model.QuestionInput

/**
 * Thread-safe holder for passing rich [QuestionInput] (including multimodal [QuestionInput.Image])
 * between navigation destinations without passing large byte arrays through NavBackStackEntry bundles.
 */
object PendingSolveInputHolder {

    @Volatile
    private var _pendingInput: QuestionInput? = null

    var pendingInput: QuestionInput?
        get() = _pendingInput
        set(value) {
            _pendingInput = value
        }

    @Synchronized
    fun consumePendingInput(): QuestionInput? {
        val input = _pendingInput
        _pendingInput = null
        return input
    }
}
